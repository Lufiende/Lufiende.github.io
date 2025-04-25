---
layout: post
title: "[Pwn] 基于 WSL 的 Kali - Linux 环境配置"
date: 2025-01-22 23:45 +0800

description: >-
  使用我们在 Windows 上最棒的 Linux 虚拟机平台 - WSL2 并搭配 VSCode 创建一个易于使用的 Pwn 环境虚拟机 

categories: [CTF-Pwn | 针对 CTF 的二进制安全, Pwn-Environment | 基础环境搭建 ]
tags: [CTF, Pwn-入门环境]

---

> **本文在 2025.01 编写，请注意时效性**
>
> **我在 2025.04 按教程装了一遍，暂时没有问题，顺便补充了一些**

**观前提醒：**

1. 本教程默认你已经解决了任何网络问题，有能力让虚拟机通过代理连接网络，不再提供换源等类似的教程
2. 由于 WSL 仍具有许多特性和 “特性” ，大家如果**遇到问题一定要多百度**
3. 图片服务部署在 `Cloudflare` ，数量较多，**卡顿可以使用更优的上网策略**
4. 虽然是个很 **SB** 的问题但是 `/path/to/xxx` 是指**你环境中 xxx 的路径** 

## 1. 安装 WSL 2

无论你有没有安装过子系统，在你选择了 `Windows 11` 的时候，你就可以使用 `wsl` 命令

在此之前，请**确保你开启了 `Windows 功能` 中的 `适用于 Linux 的 Windows 子系统` 与 `虚拟机平台`**

微软提供了详细的安装 `WSL 2` 的方式：[安装 WSL &#124; Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/wsl/install)，~~如果你不额外加参数的话好像会直接安装 Ubuntu~~

简单来讲就是在 `cmd`（`Powershell`）里一句命令的事情

```powershell
wsl --update
```

## 2. 下载并安装 Kali

### 2-1 使用微软商店

使用微软商店是最简单的方式，直接打开 `Microsoft Store` 搜索 `Kali Linux` 下载安装并打开

<img src="https://webimage.lufiende.work/1745488081622.png" style="zoom: 50%;"  />

### 2-2 使用命令行

也是很简单的方式，我们只需要输入

```powershell
wsl -l -o
::或者是 wsl --list --online
```

然后输入

```powershell
wsl.exe --install <发行版名称>
```

安装即可

<img src="https://webimage.lufiende.work/1745488118042.png" alt="{CBE6E768-1BCC-4869-82D5-984D1C9FD922}" style="zoom:80%;" />

### 2-2 直接安装 & 手动解压打开

使用微软商店安装镜像会默认安装到 C 盘，这里可以手动解压微软官方的 Appx 安装包并运行安装包的初始化 exe 程序，确保镜像生成在和 exe 程序相同目录，免去二次迁移位置的苦恼

下载 Kali Linux 的 Appx 可以在 [Microsoft Store - Generation Project (v1.2.3)](https://store.rg-adguard.net/) 中下载，你只需要粘贴微软官方商店页面链接就可以下载了，本体在 `Appxbundle` 中

<img src="https://webimage.lufiende.work/1745488122829.png" style="zoom: 33%;" />

下载好以后可以**双击安装**，当然，用压缩软件打开发现以下文件

<img src="https://webimage.lufiende.work/1745488128837.png" style="zoom:50%;" />

选择最下面的 x64 并再次用压缩软件打开（除非你真的用 ARM 架构的 Windows），并挑个好位置解压，文件夹里面应该有下面的文件，到此就算安装完毕了，只需要启动 `kali.exe` 就可以进行初始化

<img src="https://webimage.lufiende.work/1745488132074.png" style="zoom:50%;" />

## 3. 配置 Kali

第一次打开需要输入用户名和密码，按提示设置即可，设置完会出现下面的东西，以防万一还是提醒一下**你看不到你输入的密码**

<img src="https://webimage.lufiende.work/1745488136984.png" style="zoom: 50%;" />

意思是 WSL 安装 Kali 都是以最小化模式安装的，并没有附带 Kali 的哪些强大的工具包，接下来就是去安装那些包的过程，安装的包叫 **`Metapackages`**，就是一次能安很多包的包，为了以后的方便，我们需要安装一些初始工具包，让 Kali 更加完整，我们会在下面指导这部分的安装内容，安装完后会**自动消失**

当然你也可以选择不安装，我这里选择不安装自带包，感觉我不是很用的上，只要执行下面的命令就可以忽略这条提示

```shell
touch ~/.hushlogin
```

如果你开着一些代理软件，你可能会发现，他会告诉你诸如 Nat 模式无法使用代理等等的提醒，这个时候你可以尝试去改动一些 WSL 的设置，如果你开着 Windows 的更新，你大抵是可以在开始菜单看到这个

![image-20250118001152381](https://webimage.lufiende.work/1745488619133.png)

你可以参考我的设置，我放到了下面，如果你没有看到这个，你可以去用户目录下（`C:\Users\xxx`）新建一个 `.wslconfig` 文件写入配置，具体配置写法可以参照：[WSL 中的高级设置配置 &#124; Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config)（事实上能改的不止这一个，还有`wsl.conf`，`.wslgconfig` 等）我也会把配置文件的示例附上

<img src="https://webimage.lufiende.work/1745488141260.png" alt="image-20250122101654131" style="zoom:50%;" />

配置文件内容如下~~（实际就是个配置文件生成器）~~

```text
[wsl2]
networkingMode=mirrored
[experimental]
hostAddressLoopback=true
```

<img src="https://webimage.lufiende.work/1745488143258.png" alt="image-20250118003219105" style="zoom:50%;" />

最关键的其实是这个 **`Mirrored`** 的网络模式，这个是继承自 `Hyper-V` 的功能，十分方便，能直接引用系统代理

如果你将来要进一步进行各种物联网仿真工作的话，其实 `Nat` 也是一种很好的选择

### 3-1 汉化 Kali

先不急着安装，我们可以趁机把汉化搞一下

```shell
sudo apt install locales
sudo dpkg-reconfigure locales
```

看介绍，这是要生成不同地区使用语言的区域设置，用滚轮或者上下键选择语言，这里以防万一可以全选，也可以拉下去只选 `zh_CN.UTF-8 UTF-8 和 en_US.UTF-8 UTF-8`，然后回车

<img src="https://webimage.lufiende.work/1745488147697.png" style="zoom:50%;" />

回车后，接下来是选择默认语言，选择 `zh_CN.UTF-8` 就可以，~~除非你是罕见~~，**选完之后关掉现在的终端**，重启或者 logout 也行，重新打开就能看见效果，~~比如看看 apt 的超级牛力~~

<img src="https://webimage.lufiende.work/1745488150958.png" alt="image-20250118003548020" style="zoom:50%;" />

### 3-2 安装 Kali 提供的 MetaPackages



官方链接：[Kali Linux Metapackages &#124; Kali Linux Documentation](https://www.kali.org/docs/general-use/metapackages/) 可以按官方教程来



我们首先需要执行

```shell
sudo apt update
sudo apt full-upgrade -y
kali-tweaks
```

然后就会出现

<img src="https://webimage.lufiende.work/1745488153624.png" style="zoom:50%;" />

第二项就是我们要安装的 `Metapackages` 了，这里我放出来了官方的描述

> - `kali-linux-core`: Base Kali Linux System – core items that are always included
> - `kali-linux-headless`: Default install that doesn’t require GUI
> - `kali-linux-default`: “Default” desktop images include these tools
> - `kali-linux-arm`: All tools suitable for ARM devices
> - `kali-linux-nethunter`: Tools used as part of Kali NetHunter

一般选圈住的第一个的 `kali-linux-default`，这里我考虑到可能用不到图形化界面所以选择了 `kali-linux-headless`，如果喜欢一步到位可以选择 `kali-linux-large`，如果有特殊需求可以结合官网安装其他的包

<img src="https://webimage.lufiende.work/1745488158852.png" style="zoom:50%;" />

### 3-3 其他在 kali-tweaks 的修改

#### 3-3-1 Shell & Prompt

![image-20250118004737613](https://webimage.lufiende.work/1745488161616.png)

`Configure Prompt` 用于调整终端的主题样式，可以自行摸索

`Default Login Shell` 用于调整默认终端，一般是 `bash`  和 `zsh` 中选择，**这里建议大家可以在把默认终端改成 zsh**，因为好用

`Reset Shell Config` 用于重置终端设置，就是 `.bashrc` 和 `.zshrc` 之类的

#### 3-3-2 Network Repositories

![image-20250118005155331](https://webimage.lufiende.work/1745488171512.png)

`Additional Kali repositories` 别选，选的人自然会选，~~各位师傅你也不想因为一些包不稳定的更新而崩溃吧~~

`Mirrors` 是下载源的设置，你看到这里会发现**我根本没有提过换源**这个说法，其实是 **kali 会自动用适合所在地的镜像**而已，如果没有特殊原因无需变动

`Protocol` 是选协议，对于 apt 来说 **https 其实安全不到哪去**，维持原样即可

#### 3-3-3 Hardening Settings

![image-20250118210643306](https://webimage.lufiende.work/1745488173648.png)

`Kernel settings` 涉及到关于 `dmesg` 命令的使用权限以及 `特权端口` 选项的开关，这个根据需要配置，~~你当个赛棍还管这么多，又用不到~~

`Wide Compatibility mode` 可以让你连接一些旧的，老的，不安全的客户端，按需开启

### 3-4 个性化终端（可选，kali 的其实也不错）

#### 3-4-1 安装 oh-my-zsh

新版的 kali 可能会自带 git 、curl 和 wget （因为 wsl 版内置了 `kali-linux-wsl` 的元包），如果没有可以执行

```sh
sudo apt install wget git curl
```

这里使用 oh-my-zsh 来进行个性化，官网：[Oh My Zsh - a delightful & open source framework for Zsh](https://ohmyz.sh/)

点击 install oh-my-zsh 之后，页面会自动滚到下载连接页

<img src="https://webimage.lufiende.work/1745488179829.png" style="zoom:50%;" />

```shell
# 复制下载链接（注意时效性，二选一）
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

链接粘贴到终端下载就行，安装时会自动帮你把原本的 .zshrc 备份到同目录下的 .zshrc.pre-oh-my-zsh

效果如下图

<img src="https://webimage.lufiende.work/1745488476550.png" alt="image-20250118224942007" style="zoom: 50%;" />

#### 3-4-2 安装前置字体

在此之前，你需要了解，因为这些主题通常会用到专业的字体，常见的可能就是 `Nerd` 和 `Powerline` ，**某些主题很可能会推荐其中之一的字体，甚至是会直接提供基于这些字体修补过的专用字体，安装主题时需要多留意源网页的安装指导**

比如下文的`Powerlevel10k` 使用了修补过的 nerd 字体，链接为 [romkatv/powerlevel10k：一个 Zsh 主题](https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#meslo-nerd-font-patched-for-powerlevel10k)

> 推荐的字体分别为：
>
> [MesloLGS NF Regular.ttf](https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS NF Regular.ttf)
>
> [MesloLGS NF Bold.ttf](https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS NF Bold.ttf)
>
> [MesloLGS NF Italic.ttf](https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS NF Italic.ttf)
>
> [MesloLGS NF Bold Italic.ttf](https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS NF Bold Italic.ttf)

如果没有给出特定的下载连接或者是字体样式，你可以尝试普通的 `Nerd` 或者是 `Powerline`

Nerd 下载地址：[Nerd Fonts - Iconic font aggregator, glyphs/icons collection, & fonts patcher](https://www.nerdfonts.com/)

Powerline 仓库： [powerline/fonts: Patched fonts for Powerline users.](https://github.com/powerline/fonts)

Nerd 字体安装只需要下载字体安装即可，有些主题可能会指定下面的其中一种

<img src="https://webimage.lufiende.work/1745488481417.png" style="zoom:50%;" />

Powerline 的话克隆一下仓库安装就行（Windows 下）

```powershell
git clone https://github.com/powerline/fonts.git
cd .\fonts\
.\install.ps1
```

由于通常使用子系统会使用 Windows Terminal ，所以我们需要在 Windows Terminal 进行一些配置

<img src="https://webimage.lufiende.work/1745488482230.png" style="zoom:50%;" />

<img src="https://webimage.lufiende.work/1745488485745.png" style="zoom:50%;" />

选择安装的字体就可以了，图片仅作示例

#### 3-4-3 搜索并安装主题

完成这些工作，你可以在官网的 Themes 找到各种主题

<img src="https://webimage.lufiende.work/1745488491476.png" style="zoom:50%;" />

当然也可以自行在搜索引擎上寻找自己喜欢的主题

但是，**每个主题的安装方式可能有差别**，所以请大家仔细阅读每个主题提供的安装文档！

这里我以 `Powerlevel10k` 主题为例，链接：[romkatv/powerlevel10k: A Zsh theme](https://github.com/romkatv/powerlevel10k) ，选择它

可以参考源页面的安装方法，下载方式

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

也可以使用 gitee.com 上的官方镜像加速下载

```bash
git clone --depth=1 https://gitee.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

编辑 `~/.zshrc` 并找到  `ZSH_THEME` , 改为 `"powerlevel10k/powerlevel10k"`.

<img src="https://webimage.lufiende.work/1745488494963.png" alt="image-20250119130400714" style="zoom:67%;" />

这个主题第一次运行会有一个引导初始化设置的界面，如果不小心关掉或者想尝试一些别的设置可以使用 `p10k configure` 再次启动

<img src="https://webimage.lufiende.work/1745488496624.png" alt="image-20250119130957483" style="zoom:67%;" />

#### 3-4-4 启用一些喜欢的 `oh-my-zsh` 插件

zsh 内置了许多丰富的插件，查看可以在 `$ZSH/plugins/` 下查看

<img src="https://webimage.lufiende.work/1745488500825.png" style="zoom: 50%;" />

网络上也有许多优秀的插件，比如 `zsh-syntax-highlighting`，链接：https://github.com/zsh-users/zsh-syntax-highlighting

它们都在 `$ZSH/custom/plugins/` 目录下

包括 `zsh-syntax-highlighting` 在内的第三方插件都会在 github 官方文档中写明插件的安装方式，例如

```
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

更多有意思的插件可以在网络上寻找或查找相关大佬的文章

当安装好插件后就可以启用了，还是在 `.zshrc` 中启用，我们找到 `plugins=()` 进行修改

```shell
# vim ~/.zshrc

plugins=(
	# 我的示例，这里面写你要添加的插件名字
	git
	vscode
	zsh-syntax-highlighting # 外部
	z
	sublime
	virtualenv
	ssh
	zsh-completions # 外部
	docker
	docker-compose
	debian
	conda
	conda-env
	command-not-found
	github
	history 
	history-substring-search
	qrcode
	nvm
	npm
	node
	nodenv
	nmap
	rust
	ruby
	rbenv
	tmux
	you-should-use # 外部
	)
```

保存退出，重启 zsh 就可以看到改变了

## 4. 安装 Pwn 环境

### 4-1 安装须知

由于 Kali-linux 是一个 `Rolling Release` 即 `滚动更新` 版本，**`apt` 会不定期的更新安装所有安装的包**，~~如果你和小伙伴约定组一辈子的 ctf 战队的话~~，**如果遇到更新 Python 的情况，默认使用系统安装的 Python 的话，默认 Python 有朝一日可能会被更改成一个更新的版本**，这时候你使用 Python 就会发现你的 Python 环境一朝回到解放前，只能使用诸如 `python3.xx` 的命令运行 Python 并且一些程序也会因为缺少依赖而无法运作，这是因为**他会改掉 `Python` 的默认值**

理论上**你可以通过修改 Python 的链接符号**来达成目的，但是我认为通过 `pip` 安装会在滚动更新的系统上引起一些其他不必要的 bug，所以我选择使用 `pyenv` 或者 `Anconda` 创建一个虚拟环境来安装需要的包

**如果你认为不需要的话可以忽略**，直接安装，在文章编写日期时，使用 `pip` 安装的时候记得加上 `--break-system-packages` ，不然就会出现图像里面的状况

<img src="https://webimage.lufiende.work/1745488513533.png" alt="image-20250119134143194" style="zoom: 50%;" />

### 4-2 安装 Anconda（Miniconda）并创建一个专用的 Python 环境

其实作为一个沟槽的 Pwn 手用不到高贵开发用到的库，`Anconda` 自带的库我们很可能用不到，反正用到还能自己装，所以我们选择小而美的 `Miniconda`，当然选择 `Anconda` 也可以

Anconda 官网：[Download Anaconda Distribution &#124; Anaconda](https://www.anaconda.com/download)

点击 `Skip Registration` 跳过登录即可下载（或者 [Download Now &#124; Anaconda](https://www.anaconda.com/download/success)），不过为了方便我们可以复制下载链接使用 wget（注意链接时效性）

```bash
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
chmod 777 
./Miniconda3-latest-Linux-x86_64.sh
```

我们还可以在阅读完用户协议后定义安装路径

<img src="https://webimage.lufiende.work/1745488515317.png" alt="image-20250119151151460" style="zoom:67%;" />

安装完后记得**重启 `zsh`**

> 提示：部分 `oh-my-zsh` 主题可能会使 `conda` 显示环境名的功能失效，每个主题修复的方式不一，大家可以自行百度

在这之后，我们就可以创建一个为 CTF 准备的 Python 环境了

```bash
conda create -n <起个名字> python=3.12
conda activate <名字>
```

然后我们修改一下 `.zshrc`，如果你使用 `zsh` 的话，末尾添加

```bash
conda activate <名字>
```

就可以默认激活对应环境

### 4-3 安装 `Pwntools`

```bash
# 安装
pip install pwntools
# 验证
python
from pwn import *
```

<img src="https://webimage.lufiende.work/1745488520032.png" alt="image-20250119152657311" style="zoom:67%;" />

### 4-4 安装 GDB 以及 `Pwndbg` / `Pwngdb` / `peda` /` gef `

首先需要安装 `GDB`

```bash
sudo apt install gdb gdbserver
```

在此基础上我们会安装 `Pwndbg` / `Pwngdb` /`peda` / `gef` ，**事实上 `Pwndbg` 是目前最常用的，其他的在后期之外可能根本用不到**，考虑只使用 `Pwndbg` 其实可以满足大部分需求，尤其是对于入门师傅来说

#### 4-4-1 手动安装

找一个你喜欢的地方，克隆 `pwndbg` ，`pwngdb`， `peda`， `gef`

```bash
git clone https://github.com/pwndbg/pwndbg  </path/to/Pwndbg(可选)>

git clone https://github.com/scwuaptx/Pwngdb.git  </path/to/Pwngdb(可选)>

git clone https://github.com/longld/peda.git  </path/to/Peda(可选)>

sudo apt install binutils 
sudo apt install file # 需要 readelf file
git clone https://github.com/hugsy/gef.git  </path/to/GEF(可选)>
```

##### 4-4-1-1 安装 `Pwndbg`

虽然我们一共下载了四个，但是实际上我们一般使用 `Pwndbg` 居多，我们优先安装它

```bash
cd /path/to/pwndbg
./setup.sh
```

挂好梯子直接一把梭

##### 4-4-1-2  同时集成安装 `Peda` 和 `GEF`，配置不同启动方式 

> 此内容参考了：
> [D1ag0n-Young/gdb321: pwndbg、pwn-peda、pwn-gef和Pwngdb四合一，一合四，通过命令gdb-peda、gdb-pwndbg、gdb-peda轻松切换gdb插件 ](https://github.com/D1ag0n-Young/gdb321)
> 在此十分感谢！

首先备份下 `.gdbinit`

```bash
cp ~/.gdbinit /path/to/.gdbinit_pwndbg
```

修改 `~` 下的 `.gdbinit` 文件

```bash
define init-peda
source /path/to/Peda/peda.py
source /path/to/PwnGDB/pwngdb.py
source /path/to/PwnGDB/angelheap/gdbinit.py
end
document init-peda
Initializes the PEDA (Python Exploit Development Assistant for GDB) framework
end

define init-pwndbg
source /path/to/.gdbinit_pwnbdg
source /path/to/PwnGDB/pwngdb.py
source /path/to/PwnGDB/angelheap/gdbinit.py
end
document init-pwndbg
Initializes PwnDBG
end

define init-gef
source /path/to/GEF/gef.py
source /path/to/PwnGDB/pwngdb.py
source /path/to/PwnGDB/angelheap/gdbinit.py
end
document init-gef
Initializes GEF (GDB Enhanced Features)
end
```

为了区分，将原先的 `gdb` 可以换个名字，比如 `gdb-orig`

```bash
which gdb
# 寻找位置： /usr/bin/gdb 

sudo mv /usr/bin/gdb /usr/bin/gdb-orig
```

之后我们创建三个文件在 `/usr/bin` 中，分别启动三个插件

```bash
# sudo vim /usr/bin/gdb-gef 写入

#!/bin/sh
exec gdb-orig -q -ex init-gef "$@"

#sudo chmod 777 /usr/bin/gdb-gef
-----------------------------
# sudo vim /usr/bin/gdb-pwndbg 写入

#!/bin/sh
exec gdb-orig -q -ex init-pwndbg "$@"

# sudo chmod 777 /usr/bin/gdb-peda
-----------------------------
# sudo vim /usr/bin/gdb-peda 写入

#!/bin/sh
exec gdb-orig -q -ex init-peda "$@"

# sudo chmod 777 /usr/bin/gdb-peda
```

这下包括 `gdb-orig` 在内我们有四个命令了，效果图见下

`gef` 效果

<img src="https://webimage.lufiende.work/1745488535394.png" alt="1744212958860" style="zoom:67%;" />

`Pwndbg` 效果

<img src="https://webimage.lufiende.work/1745488537205.png" alt="{AA1D7D7E-36F2-4D92-AE68-040F6ED0FE3C}" style="zoom:67%;" />

`peda` 效果，这是对的，别急

<img src="https://webimage.lufiende.work/1745488540557.png" alt="{99111FFA-51C7-4D9A-9D3E-989F809D6FA1}" style="zoom:67%;" />

##### 4-4-1-3 设置第一启动项

很好，我们现在有了四个，那我们只要选一个常用的就可以了

```bash
sudo vim /usr/bin/gdb
# 写入
# #!/bin/sh
# exec gdb-<你想要用的> "$@"
sudo chmod 777 /usr/bin/gdb
```

#### 4-4-2 使用一键综合安装 `gdb321` 安装

这里推荐一个整合安装的项目：[D1ag0n-Young/gdb321: pwndbg、pwn-peda、pwn-gef和Pwngdb四合一，一合四，通过命令gdb-peda、gdb-pwndbg、gdb-peda轻松切换gdb插件 ](https://github.com/D1ag0n-Young/gdb321) 大家可以点个 Star

```bash
git clone https://github.com/D1ag0n-Young/gdb321.git
cd gdb321
```

该插件提供了两种安装方式，一种是直接 clone 对应仓库到 `Home` 目录下并安装，还有一种是使用 gdb321 目录下的 `Pwndbg` / `Pwngdb` /`peda` / `gef` 安装

> 提示：
>
> 1. 默认安装会把四个插件全部装载到 `Home` 目录下，如果你不想这样，可以自行修改脚本，更改位置
> 2. 由于一些问题，若在安装过程中如果**脚本完走**但是**安装实际不成功**的时候需要先 remove

直接安装好说，直接执行

```bash
./run_gdb.sh install # 卸载可以 ./run_gdb.sh remove
```

如果下载不畅，或者要对插件进行一些修改，可以尝试另一种安装方法

在文件夹中有一个 `submodule` 文件夹，内有三个插件的目录

![image-20250119170347023](https://webimage.lufiende.work/1745488548135.png)

我们可以先在四个文件夹中克隆四个库

```bash
git clone https://github.com/longld/peda.git ./peda
git clone https://github.com/pwndbg/pwndbg.git ./pwndbg
git clone https://github.com/hugsy/gef.git ./gef
git clone https://github.com/scwuaptx/Pwngdb.git ./Pwngdb
```

再运行

```bash
./run_gdb_local.sh install
```

简单说明一下使用方法

```bash
gdb 
gdb-peda # 指定peda 
gdb-pwndbg # 指定pwndbg 
gdb-gef # 指定gef 

sudo ./Switchdefault.sh <pwndbg/gdb/gef/peda> # 切换默认使用 gdb 的加载项
sudo ./Switch-GdbMul-default.sh <pwndbg/gdb/gef/peda> # 切换默认使用 gdb-multiarch 的加载项

gdb-mul # 启动指定插件的 gdb-multiarch
```

#### 4-4-3 `peda` 的修复

截至 2025.01，`peda` 最近一次更新在 2021 年，其使用的 `six` 模块与最新的 `Python 3.1x （甚至更高）` 不契合，由于 `gdb` 默认使用系统的 `python` 所以我们需要使用 `apt` 安装

```bash
sudo apt install python3-six
```

并删除 `peda` 文件夹下的 `lib/six.py`

除此之外，运行 `peda` 会显示警告，他们并不会影响运行，如果你丝毫不在意这些，你完全可以忽略它

如果你使用了上文所述或者是 `gdb321` 安装的话，你可以修改 `gdb-peda` 来关闭表达式不匹配的的错误警告

```bash
#sudo vim /usr/bin/gdb-peda

#!/bin/sh
export PYTHONWARNINGS="ignore" # 新增的
exec gdb-source -q -ex init-peda "$@"
```

如果你没有使用上文所述或者是 `gdb321` 安装的话，（假设你真的使用 `peda`）你可以创建一个类似 `gdb-peda` 的文件来带上 `export PYTHONWARNINGS="ignore"`

```bash
#sudo vim /usr/bin/gdb-peda

#!/bin/sh
export PYTHONWARNINGS="ignore" # 新增的
exec gdb
```

#### 4-4-4 `PwnGDB` 的去重

这不是一个大问题，但是这会导致 `Pwndbg` 的 `canary` 以及 `got` 命令被替换，对于喜欢 `pwndbg` 的命令（其实是因为颜色）的人来说，你可以去搞一下这个

其实作者留下了一个兼容的脚本，就在 `Pwngdb/pwndbg` 中，不过由于更新问题兼容较为麻烦，这里我们有一种简单粗暴的方法

<img src="https://webimage.lufiende.work/1745488552384.png" alt="{92A115CA-0094-421E-8D7D-CEC5FAA00076}" style="zoom:50%;" />

<img src="https://webimage.lufiende.work/1745488554572.png" alt="{D39FA073-D57D-4371-9089-BE5E14105FAC}" style="zoom:50%;" />

我们直接找到 `/path/to/Pwngdb/pwngdb.py` 使用直接注释法，把上图两个位置的函数注释掉就行

效果对比

<img src="https://webimage.lufiende.work/1745488557953.png" alt="{DC815D3A-CB22-4105-9D68-E8D8D332A05C}" style="zoom: 67%;" />

<img src="https://webimage.lufiende.work/1745488563013.png" alt="{E7DAB3AF-62E6-47CF-88E9-054396737FDE}" style="zoom:67%;" />

### 4-5 （挖坑）安装 `LLDB` 并启用 `Pwndbg`

没成功，可以玩玩

> **什么是 LLDB ？我们对 Grok 先生进行了采访**：
>
> LLDB（Low Level Debugger）是一个功能强大的开源调试器，属于 LLVM 项目家族的一部分。它最初由 Apple 开发，作为 macOS 和 iOS 开发的主要调试工具，但现已扩展到支持多个平台，包括 Linux 和 Windows。LLDB 被设计为一个高性能、可扩展的调试器，广泛用于调试 C、C++、Objective-C 和 Swift 等语言的程序。
>
> 以下是对 LLDB 的详细介绍：
>
> **LLDB 是什么？**
>
> LLDB 是一个命令行调试器，同时也提供了一个强大的 API，可以嵌入到 IDE（如 Xcode）或其他工具中。它是 GDB（GNU Debugger）的替代品，旨在解决 GDB 的一些局限性，例如性能问题和对现代语言的支持不足。LLDB 利用了 LLVM 的基础设施（如 Clang 编译器和 LLVM 的优化框架），因此在解析代码和处理符号信息方面表现尤为出色。
>
> **主要特点**
>
> - **模块化设计**：LLDB 采用插件式架构，支持多种目标架构（如 x86、x64、ARM、AArch64）和操作系统。
> - **强大的语言支持**：对 C、C++、Objective-C 和 Swift 有原生支持，能够解析复杂的表达式和数据结构。
> - **高性能**：得益于 LLVM 的基础设施，LLDB 在符号解析和断点设置上速度很快。
> - **脚本化能力**：内置 Python 支持，允许用户编写脚本扩展功能（类似 GDB 的 Python API）。
> - **远程调试**：支持跨平台远程调试，例如调试嵌入式设备或 iOS 应用。
> - **与 Xcode 集成**：在 macOS 上，LLDB 是 Xcode 的默认调试器，提供图形化界面支持。
>
> **基本工作原理**
>
> LLDB 的核心由以下几个部分组成：
>
> - **前端**：用户交互部分，通常是命令行界面或 IDE。
> - **调试核心**：负责控制目标进程、设置断点、管理线程等。
> - **目标支持**：通过插件支持不同的 CPU 架构和操作系统。
> - **符号解析**：利用 Clang 处理源代码和调试信息（如 DWARF）。
>
> 当你运行 LLDB 时，它会加载目标程序，解析符号表，并允许你通过命令控制程序的执行。

安装 `LLDB`

```bash
sudo apt install lldb
```

### 4-6 安装其他小部件

如果你使用了 `venv`  或者是 `anconda / miniconda` 记得一定要激活环境

```bash
conda activate <name>
```

1. **`ROPgadget`** or **`ropper`**

   ```bash
   pip install ROPgadget
   pip install ropper
   ```

2. **`one_gadget`** 

   ```bash
   sudo apt install ruby ruby-dev gcc make
   sudo gem install one_gadget
   ```

3. **`seccomp-tools`**

   ```bash
   sudo gem install seccomp-tools
   ```

### 4-7 安装 glibc 环境更改工具

#### 4-6-1 `patchelf` 和 `glibc-all-in-one`

   ```bash
   pip install patchelf
   git clone https://github.com/matrix1001/glibc-all-in-one.git
   ```

`glibc-all-in-one` 官方页面在：[matrix1001/glibc-all-in-one: 🎁A convenient glibc binary and debug file downloader and source code auto builder](https://github.com/matrix1001/glibc-all-in-one) 可以参考进行进一步下载不同版本 `libc` 的方式

```bash
cd ./glibc-all-in-one 

./update_list # 更新列表

cat list # 查看列表

./download <name> # 开始下载
```

在之后使用 `patchelf` 即可

```bash
patchelf --set-interpreter <ld 位置> <文件位置>
patchelf --replace-needed <需替换的 libc 类型，例如 "libc.so.6"> <libc 位置> <文件位置>
或者
patchelf --set-rpath <'动态库文件夹位置1(必选):动态库文件夹位置1(可选):......'> <文件位置>
```

#### 4-6-2 使用一键综合换环境工具 `cpwn`

这里推荐一个整合安装的项目，可以识别目录中的 `libc` 版本，下载对应有符号表，有源代码的 `libc` 并自动 `patchelf`：[GeekCmore/cpwn: A tool to initialize pwn game exploit enviroment.](https://github.com/GeekCmore/cpwn) 大家有兴趣可以尝试一下，**觉得好用可以为作者点个 star**

```bash
git clone https://github.com/GeekCmore/cpwn.git
cd ./cpwn
```

在开始安装前，你可以修改 `config.json` ，`cpwn.py` 和 `setup.sh` 来自定义资源文件存放位置，默认会在 `~/.config/cpwn` 下的各级目录

其中，修改资源存放位置下的 `template.sh` 可以修改每次生成的默认脚本，修改好之后继续下一步

```bash
./setup.sh
```

初次使用需要执行

```bash
cpwn fetch
```

同时也可以用于一部分比较常规的，漏洞通过 `.ko` 模块加载的内核题目，其中 `kernel_exploit` 为每次的起手式

```bash
cpwn kernel /path/to/start.sh /path/to/rootfs.cpio /path/to/bzImage
```

如果报错的话，你可能需要修改的地方，直接修改 `cpwn` 即可

<img src="https://webimage.lufiende.work/1745488567828.png" alt="{5ED4151B-E764-48B7-AA18-6142236C07A0}" style="zoom:80%;" />

### 4-7 安装 `libcsearcher`

别忘了这个，激活对应的环境

```bash
conda activate <名字> 
```

前期学习路上永远的神之一，源网页：[lieanu/LibcSearcher: glibc offset search for ctf.](https://github.com/lieanu/LibcSearcher)

```bash
git clone https://github.com/lieanu/LibcSearcher.git
cd ./LibcSearcher
pip install -e .
```

由于这个库也有点年代了，我们可以更新一下库，鉴于年代久远，我们可以直接 clone 最新的 `libc-database` 并通过符号链接的方式更新

```bash
cd <任意位置>

git clone https://github.com/niklasb/libc-database.git
cd libc-database
sudo apt install binutils file wget rpm2cpio cpio zstd jq

./get ubuntu # 也可以 ./get all 不过 ubuntu 够用了，除非出题人喜欢恶趣味

# 小等一会

cp -r /path/to/LibcSearcher/libc-database/db/* /path/to/libc-database/db
rm /path/to/LibcSearcher/libc-database -rf

ln -s /path/to/libc-database/db /path/to/LibcSearcher/libc-database/db
```

## 5. 安装与宿主机联动的 `VSCode` 环境

首先，确保宿主机安装了 `VSCode` ，并且安装了 `WSL 插件` 

![image-20250121181223598](https://webimage.lufiende.work/1745488570606.png)

尝试在 `VSCode` 中连接一下当前的虚拟机，点左边下面的 `><` 点 `连接到wsl`

![image-20250122094504515](https://webimage.lufiende.work/1745488572919.png)

或者，尝试在虚拟机中使用

```bash
code .
```

一般来讲会安装一个叫 `.vscode-server` 的东西，这个安装完就可以正常使用

如果不能用，把下面这个放到 `.bashrc` 或者是 `.zshrc` 

```bash
alias code="/mnt/<映射主机的 VSCode 安装目录>/bin/code"
```

之后直接在目录中使用

```powershell
wsl -d kali-linux
code .
```

即可使用 `vscode` 编写脚本

## 6 备份 WSL 2

十分简单，备份只需要

```cmd
wsl --export <发行版名称> X:\path\to\xxx.tar
```

导入可以

```cmd
wsl --import <发行版名称> X:\path\to\ext4.vhdx<存放目录>  X:\path\to\xxx.tar<备份目录> --version 2
```







