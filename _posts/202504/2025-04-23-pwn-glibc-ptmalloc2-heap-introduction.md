---
layout: post
title: "[Pwn] Glibc 中 Ptmalloc2 下的 Heap - Part 01"
date: 2025-04-23 15:01 +0800

description: >-
  面向 2.23 以及更高版本的 Glibc 源码，结合自身经验对于 Glibc 中 Ptmalloc2 堆管理器特性的解析

categories: [CTF-Pwn | 针对 CTF 的二进制安全, Pwn-Glibc-Ptmalloc2Heap | 基于 Glibc Ptmalloc2 的堆 ]
tags: [CTF, Pwn-Glibc-Ptmalloc2Heap]
---

> **本文在 2024.02 编写，于 2025.04 进行修改与完善，请注意时效性**
>
> **注意：该文章为**<span class="blackout" title="你知道的太多了">被压榨要求完成主人任务录视频的</span>**新手时期所写，虽然我进行了修正，但是可能会出现包括但不限于*语言风格跳跃，质量参差不齐，左右脑互博，思维不连贯*等不和谐的地方**

**观前须知**：

1. 个人认为，堆是庞大而又复杂的东西，要想真正的认识堆，把堆搞明白了，其实是有难度的
2. 由于众所周知的原因，随着 `Glibc` 版本的更迭，堆呈现出来的性质也是不一样的，一般入门的话都是从旧版本的堆的特性开始学习，在之后的内容会逐步涉及更高版本的内容

## 1. 环境前置知识

由于堆的特性与 `Glibc` 的版本息息相关，如果想要了解不同版本的特性，甚至是面对不同的题目，你需要更换你的 `Glibc` 版本，下面几种方法可供你使用：

### 1-1 做题向

要观察不同环境下堆的表现，或者是启动对应版本的题目，可以使用下面的方式

1. `patchelf` 和 `glibc-all-in-one` 前者可以指定某个二进制文件使用对应的 `Glibc` 版本运行，后者则是可以方便你下载各个版本。

2. 如果你有一个特定版本的 `libc` 和 `ld`，在你写的脚本中打开本地进程这么写：

   ```python
   process([" ld 路径 ", "./题目"], env={"LD_PRELOAD":" libc 路径 "})
   ```

   `LD_PRELOAD` 加载的库有**很高的优先级**，它也可以广泛的用于 `C++` 环境的更改中

3. 使用一些自动化检测 `libc.so.6` 版本并自动替换环境的脚本

### 1-2 编译向

如果你要出题，或者是测试一些 Demo 你需要编译对应版本的程序，首先需要注意**低版本 Glibc 环境无法运行高版本系统编译出的程序以及程序所用到的在高版本系统上依赖 Glibc 编译的库**，其次**高版本兼容低版本系统编译的程序但是特性按高版本的来**，所以最好是想哪个版本就使用哪个版本的环境编译

1. 最简单的，把 `Ubuntu 16.04` 到 `Ubuntu latest version` 中所有流行的发行版全下载配置一遍

2. 下载好对应版本的 `libc` 和 `ld` 在 `GCC` 编译时指定参数 `rpath` 和 `dynamic-linker`

   ```bash
   gcc test.c -o test -Wl,--rpath=/path/to/x86_64-linux-gnu/ -Wl,--dynamic-linker=/path/to/ld-linux-x86-64.so.2
   ```

   `rpath` 目录一般包含但不限于下面文件

   <img src="https://webimage.lufiende.work/1745488695200.png" alt="{952901D2-8FF5-44BE-BFB0-764605A89C7F}" style="zoom:80%;" />

   我们这么一通编译的效果如下

   ![{EAFA1DFE-C34B-4F40-99AA-A5F7FE40DEC1}](https://webimage.lufiende.work/1745488697315.png)

## 2. 堆的初步了解

### 2-1 堆是什么？

在C语言中，内存管理有**动态内存管理、静态内存管理（Data & BSS 段）、自动内存分配（Stack）**三种办法，其中动态内存管理就是对堆的利用

**动态内存**，也称为堆内存，**理论上**堆内存在**手动释放**或**程序结束**之前均可访问，同时允许我们在**程序执行期间随时分配和释放内存**，它非常适合**存储大型数据结构**或**大小事先未知的对象**。堆使得程序员分配内存变得更加灵活，在一定程度上也解决了内存不足的问题。

### 2-2 堆在哪里？

当**申请（使用 `malloc()` 函数）内存块后**，堆段才会出现，堆**由低地址向高地址方向增长**，当我们在 `pwndbg` 中使用 `vmmap` 指令可以看`heap` 段在内存中的位置：

<img src="https://webimage.lufiende.work/1745488700389.png" alt="1.2-001" style="zoom:67%;" />

可以看到，堆在内存中的位置处于**库函数内存映射段**与**数据段**之间，在 `No PIE`  的时候它和数据段是紧挨的，**如果开启地址随机化的话他们中间会隔一段随机的距离，但是遵循页对齐的规则**

### 2-3 堆从哪里来？

~~*当然是申请来的 （即答）*~~，那么**当我们在程序中第一次申请了一块空间时到底发生了什么？**

#### 2-3-1 提前科普

为了防止你会懵，所以对于有些下文会提到但是已经涉及到的东西讲解一下，比较粗略，了解即可：

- **`Top chunk`**：当程序第一次进行 `malloc` 的时候，会有一个**初始化的过程**，和上图一样，申请一块比较大的 heap 空间，在这之后会被分为两块，一块给用户需要的那块，剩下的那块就是 `Top chunk` ，它的作用就是**再次申请堆块要是没有合适的空间便会使用 `top chunk` 的空间**
- **`你申请到的一块堆内存的起始地址 ≠ 你可以写入数据的起始地址`**：因为一大块地方肯定不会只有一小块可用的，如果有许多的状态不同的堆块的话，使用的内容直接叠加需要额外的功夫表现一个堆块的各种特性，**堆块头部会记录一些信息**，所以你会看到下面的示例中有 0x10 大小差距
- **`你申请的大小 ≠ 实际申请的大小`**，大小对齐可以更方便的管理，所以他会有一个的取整的步骤

#### 2-3-2 演示

  我准备了下面的程序来演示：

```c
#include <stdio.h>
#include <stdlib.h>

int main()
{
    
    int *p = NULL;

    p = (int *)malloc(0x114);
    p = (int *)malloc(0x514);
    p = (int *)malloc(0x1919);
    p = (int *)malloc(0x810);

	return 0;
}
```

---

**第一次申请之前**，在我们申请内存之前，堆段并没有出现

<img src="https://webimage.lufiende.work/1745488707103.png" alt="1.3-001" style="zoom:67%;" />

---

**第一次申请后**，堆段被建立了，通过```vmmap```观察堆的size，我们得到了**21000字节的堆内存**

<img src="https://webimage.lufiende.work/1745488710026.png" alt="1.3-003" style="zoom:67%;" />

> **Q：为什么图片中堆的长度是 21000，和实际申请的大小差距很大？**
>
> **A：**事实上，当申请堆的内存时，我们可以随时随地申请，而且每次申请的内存有大有小，管理申请的堆的工作量会非常大,而申请内存的操作本身需要通过系统调用
>
> 那么不妨假设一下，如果 `malloc()` 函数**仅仅封装了可以分配内存的系统调用**（比如 `brk` 和 `mmap` ），那么频繁地调用系统调用会很消耗系统资源
>
> 所以针对这个问题,程序第一次可能只是向操作系统申请很小的内存，但是为了方便，操作系统会把很大的内存分配给程序,这样的话可以避免上面假设所说的频繁系统调用，就避免了多次内核态与用户态的切换，提高了程序的效率

---

**再从得到的内存上分配所申请的相应的小段内存**，称为**Chunk**（Allocated Chunk），并返回地址给程序

<img src="https://webimage.lufiende.work/1745488712497.png" alt="1.3-002" style="zoom:67%;" />

---

如果你申请了很多的堆块，不考虑释放堆块，那他们会按申请的顺序依次从低地址到高地址排列

<img src="https://webimage.lufiende.work/1745488759732.png" alt="1.3-004" style="zoom:67%;" />

> **Q：那么，从系统调用得到的内存又是怎么样分配的**
>
> **A：**`Glibc` 有自己的内存管理器来进行内存分配操作 `Ptmalloc2`，它实现了各种对堆的分配，回收，合并，切割等操作，对应的，不同环境也有不同的堆管理器，而针对堆的特性介绍与漏洞利用也与 `Ptmalloc2` 息息相关

### 2-4 堆相关函数

#### 2-4-1 提前科普

为了防止你会懵，所以对于有些下文会提到但是已经涉及到的东西讲解一下，比较粗略，了解即可：

- 一般使用 `free()` 函数释放的堆块**不会立刻被回收**，它们会变成一种叫 `Free Chunk` 的东西并且叫做 `xxx bin` 的名字，在**部分情况**下这类堆块释放后如果挨着一个也被释放的堆块，或者是 `Top Chunk`，他们会合并
- 上文基础上请记住 `FastBin` 是一个特例 —— **它不会轻易合并**

#### 2-4-2 相关函数介绍

<span class="blackout" title="你知道的太多了">这里只针对于在 `arena`内的情况，具体的话大家可以在以后阅读源码，目前不打算公开更详细的解析，但对源码详细解析其实并不是很难，相信各位一定可以的</span>

---

**（1）`malloc()` 函数：**分配所需的内存空间，并返回一个指向它的指针

 ```c
void* malloc(size_t size);
 ```

参数以及返回值列表

- **`size`**：要分配的字节大小，**是无符号数**，意味着如果你输入了了 `-1` ，理论上会有一个很大很大的堆，实际上会报错，因为太大 
- **`返回值`**：如果分配成功，则返回指向分配内存的指针；如果分配失败，则返回 `NULL`。

---

**（2）`calloc()` 函数：**分配所需的内存空间，并返回一个（一组）指向它（它们）的指针

 ```c
void *calloc(size_t nitems, size_t size)
 ```

参数以及返回值列表

- **`nitems`** ：需要的堆块数量，**也是无符号数**
- **`返回值`**：如果分配成功，则返回一个（一组）指向分配的堆块（堆块们）的指针，如果分配失败，则返回 `NULL`

**`malloc()` 和 `calloc()` 之间的不同点是，`malloc` 不会设置内存为零，而 `calloc` 会设置分配的内存为零**

---

**重点：（3）`realloc()` 函数：**更改已经配置的内存空间，即更改由 `malloc()` 函数分配的内存空间的大小

```c
void *realloc(void *ptr, size_t size)
```

参数以及返回值列表

- **`*ptr`** ：一个指针，指向堆块或者为空。
- **`返回值`**：看情况

1. 如果重新申请的大小大于申请内存的大小，且当前内存段后面有需要的内存空间，则直接扩展这段内存空间，`realloc()` 将返回原指针。

2. 如果重新申请的大小大于申请内存的大小**且当前内存段后面的空闲字节不够**，那么就使用堆中的第一个能够满足这一要求的内存块，**将目前的数据复制到新的位置，并将原来的数据块释放掉，返回新的内存块位置**，相当于 `free()`  +  `malloc()` 

3. **如果重新申请的大小小于申请内存的大小**，堆块会直接缩小，被削减的内存会通过 `free()` 释放

4. 如果传入了一个空的堆块地址，但是 `size` 不是 0 ，那么就相当于 `malloc()`

5. 如果传入了一个正常的堆块地址，但是 `size` 是 0 ，那么就相当于 `free()`

6. 如果申请失败，将返回 `NULL` ，此时，原来的指针仍然有效

---

**（4）free() 函数：**

释放之前调用 `calloc()`、`malloc()` 或 `realloc()` 所分配的内存空间。

 ```c
void free(void *ptr)
 ```

参数以及返回值列表

-  **`*ptr`** ：指针指向一个要释放内存的内存块，如果传递的参数是一个空指针，则不会执行任何动作，**注意 free() 不会清除内存块的数据**
- **`返回值`**：无

#### 2-4-3 函数演示

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main()
{
  setvbuf(stdin, 0, 2, 0);
  setvbuf(stdout, 0, 2, 0);
  setvbuf(stderr, 0, 2, 0);
  //设置缓冲区

  int *a = NULL, *b = NULL;
  a = (int *)ni(0x30); // 验证 malloc()
  b = (int *)malloc(0x200); // 隔离用，实际没有用
  printf("申请的地址为: %p",a); // 验证 malloc() 返回值
    
  memset(a,'m',0x30);
  free(a);
  a = (int *)malloc(0x30); // 验证 malloc() 特性 (雾)
  memset(a,'m',0x30);
  free(a);
  a = calloc(1,0x30); // 验证 calloc() 特性

  free(a);
  free(b); //打扫现场
  a = (int *)malloc(0x100);
  b = (int *)malloc(0x200);
  memset(a,'m',0x100);
  memset(b,'m',0x200);
  b = realloc(b,0x256); // 扩大但后面有空间
  a = realloc(a,0x512); // 扩大但后面无空间
  b = realloc(b,0x200); // 缩小但后面无空间
  a = realloc(a,0x486); // 缩小但后面有空间
  int *c = NULL;
  c = realloc(c,0x114); //c 为 nullptr
  c = realloc(c,0); // 释放

  return 0;
}
```

##### 2-4-3-1 **`malloc()` 演示：**
我们直接打开 `gdb` 开始调试，运行到第一个申请 0x30 大小堆块的 `malloc()`

<img src="https://webimage.lufiende.work/1745488764153.png" alt="1.4-001" style="zoom:67%;" />


运行这个命令，查看堆，使用 `heap` 命令，看到堆块已经建立，堆块地址为 `0x602000` 

<img src="https://webimage.lufiende.work/1745488766949.png" alt="1.4-002" style="zoom:67%;" />

执行`printf`函数，输出参数为数据的起始位置（上文提到了和堆块起始位置的不同），验证了 `malloc()` 会返回参数这一事实，~~虽然没什么好验证的~~。

<img src="https://webimage.lufiende.work/1745488773239.png" alt="1.4-003" style="zoom:67%;" />

##### 2-4-3-2 **`calloc()` 演示:**
接下来我们用 `m` 填满申请的堆块

<img src="https://webimage.lufiende.work/1745488771757.png" alt="1.4-004" style="zoom: 67%;" />


看一下，已经被填好了

<img src="https://webimage.lufiende.work/1745488779447.png" alt="1.4-005" style="zoom:67%;" />

`free()` 以后回来看，你会发现，填充的东西还在。**<u>逝想一下</u>，如果有什么本该清除不该出现的东西留下了，我们是不是就可以……** 

<span class="blackout" title="你知道的太多了">至于为什么有一块是空的，是因为它在释放后会进入 fastbin ，而它作为一个单链表结构需要保存一个指针指向前一个大小相同的 fastbin 堆块，你慢慢会知道的</span>

<img src="https://webimage.lufiende.work/1745488782820.png" alt="1.4-005.1" style="zoom:50%;" /> 


当你经过 `calloc()` 函数，发现它和前面那个就是不一样，申请的内存被清空了！

<img src="https://webimage.lufiende.work/1745488787617.png" alt="1.4-006" style="zoom:50%;" />

##### 2-4-3-3 **`realloc()` 演示：**
现在让另外两个堆块表演！

<img src="https://webimage.lufiende.work/1745488790329.png" alt="1.4-007" style="zoom:50%;" />


也被填充满了 `m`，现在让我们看扩大但后面有空间的情况

<img src="https://webimage.lufiende.work/1745488793028.png" alt="1.4-008" style="zoom:50%;" />


当我们执行了第一个 `realloc()` 函数，第二个堆块成功的变大了，原来的内容被保留，因为后面还有空间，所以就直接占用 `Top Chunk` 扩大自身

<img src="https://webimage.lufiende.work/1745489929578.png" alt="1.4-009" style="zoom:67%;" />

<img src="https://webimage.lufiende.work/1745489930475.png" alt="1.4-010" style="zoom:67%;" />

我们来看第一个堆块的这种扩大但后面无空间的情况，上一个堆块是因为后面还有 Top Chunk

**而第一个堆块本身就是打头的，后面还有第二个堆块，显然不能简单的扩大**，所以只能释放当前堆块，后面再申请一个新的

提醒一下，紫色的是刚才的第二个堆块，绿色的是新申请的（ 好玩的地方：**被释放的堆块内存里仍然残留着 m** ）

<img src="https://webimage.lufiende.work/1745489934199.png" alt="1.4-011" style="zoom:50%;" />

<img src="https://webimage.lufiende.work/1745489936304.png" alt="1.4-012" style="zoom:50%;" />

继续运行，我们来讨论一下堆块缩小的情况，第一种情况是紧邻这申请的堆块的堆块缩小，运行完这个函数，我们会发现缩小的堆块就在原地缩小了，地址不变，剩余部分被释放

<img src="https://webimage.lufiende.work/1745489939389.png" alt="1.4-013" style="zoom:67%;" />

继续运行，刚才提到的堆块缩小有意思的情况来了，上文提到，Fast Bin 不轻易合并，但是当我们紧邻着 Top Chunk 呢？运行完这个函数，我们会发现缩小的堆块就在原地缩小了

<span class="blackout" title="你知道的太多了">但是我们等待的 Fast Bin 并没有出现，很明显是合并了，那么可以得出这里的释放剩余空间并不是简单的 `free()` ，但我这么写其实是因为我看错了这里的大小，我以为是 0x70 实际上是 0x90 ，糖丸了</span>

这表示我们的堆块有缩小，并且被 `free()` 释放

<img src="https://webimage.lufiende.work/1745489942066.png" alt="1.4-014" style="zoom:67%;" />


继续运行，当指针为空时 `realloc()` 就相当于变成了 `malloc()` ，申请了新的堆块

<img src="https://webimage.lufiende.work/1745489944717.png" alt="1.4-015" style="zoom:67%;" />

<img src="https://webimage.lufiende.work/1745489945858.png" alt="1.4-016" style="zoom:67%;" />

继续运行，当大小为空时该堆块释放，相当于 `free()` ，执行后所圈堆块被释放（看不到是被合并了）

<img src="https://webimage.lufiende.work/1745489951586.png" alt="1.4-017" style="zoom:67%;" />

<img src="https://webimage.lufiende.work/1745489948919.png" alt="1.4-018" style="zoom:67%;" />
