---
layout: post
title: "[Blog] 博客看板娘一览"
date: 1919-08-10 10:45 +0800

description: >-
  记录了本博客右下角的看板娘，并开源看板娘的生成细节（没错基本全是 AI ） 

categories: [Blog-Construction | 博客建设 ]
tags: [Blog 建设相关]

---

## 1. 虚拟歌手

### 1-1 Vocaloid 系列

#### 1-1-1 初音未来

人物介绍：[初音未来 - 萌娘百科 万物皆可萌的百科全书](https://zh.moegirl.org.cn/初音未来)

##### # 雪未来 2023

<div align="center">
  <img src="https://webimage.lufiende.work/2023WinterMiku-HatsuneMiku.png" alt="2023WinterMiku-HatsuneMiku" width="200"/>
  <img src="https://webimage.lufiende.work/1752663074104.png" alt="1752663074104" width="200"/>
</div>



介绍：[雪未来2023 - 萌娘百科 万物皆可萌的百科全书](https://zh.moegirl.org.cn/雪未来2023)

来源：Stable Diffusion 生成，使用了 txt2img + 放大

|          参数名称           |                                                                                                                  参数数据                                                                                                                  |
| :-------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|         正向提示词          |             `1girl,chibi,<lora:hatsunemiku1:1>,yukimiku2023,cute colors,pastel colors,white background,full body,angel,wings,halo,long hair,pale skin,purple hoodie,no pants,white socks,:3 smile,neko smile,wizard's hat,hat`             |
|         反向提示词          | `EasyNegative,(worst quality:2),(low quality:2),(normal quality:2),lowres,normal_quality,((monochrome)),((grayscale)),skin_spots,skin_blemishes,age_spot,signature,((watermark)),text,((bad_hands)),bad_anatomy,verybadimagenegative_v1.3` |
|      生成步数（Steps）      |                                                                                                                    `25`                                                                                                                    |
|      采样器（Sampler）      |                                                                                                                 `Euler a`                                                                                                                  |
|     时间表（Schedule）      |                                                                                                                `Automatic`                                                                                                                 |
| 提示词引导系数（CFG scale） |                                                                                                                    `7`                                                                                                                     |
|          Clip Skip          |                                                                                                                    `2`                                                                                                                     |
|        种子（Seed）         |                                                                                                                `521377033`                                                                                                                 |
|        大小（Size）         |                                                                                                                 `768x768`                                                                                                                  |
|      模型（Model）名称      |                                                                                                     `qteamixQ_omegaFp16 (39d6af08b2)`                                                                                                      |
|          VAE 名称           |                                                                                                         `animevae.pt (f921fb3f29)`                                                                                                         |
|          Lora 使用          |                                                                                                      `hatsunemiku1 （8ccb2b9adc0a）`                                                                                                       |
|   Textual Inversion 使用    |                                                                                                      `EasyNegative （c74b4e810b03）`                                                                                                       |

## 2. 游戏角色

### 2-1 音乐游戏类

#### 2-1-1 音击

游戏介绍：[音击 - 萌娘百科 万物皆可萌的百科全书](https://zh.moegirl.org.cn/音击)

##### # 藤泽柚子

<div align="center">
  <img src="https://webimage.lufiende.work/FujisawaYuzu-Ongeki.png" alt="FujisawaYuzu-Ongeki" width="200"/>
  <img src="https://webimage.lufiende.work/1752663185467.png" alt="1752663185467" width="200"/>
</div>



介绍：[藤泽柚子 - 萌娘百科 万物皆可萌的百科全书](https://zh.moegirl.org.cn/藤泽柚子)

来源：Stable Diffusion 生成，使用了 txt2img + 放大

|          参数名称           |                                                                                                                                                                                                                         参数数据                                                                                                                                                                                                                         |
| :-------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|         正向提示词          | `1girl,(chibi:1.2),<lora:Lora_YuzuFujisawa:0.9>,(YuzuFujisawa:1.1),chibi,solo,cute colors,pastel colors,white background,full body,angel,wings,smile,shirt,long hair,green eyes,one eye closed,no pants,two side up,short sleeves,sweater vest,white shirt,blush,collared shirt,striped,bangs,red bow,open mouth,hair bow,very long hair,blonde hair,indoors,breasts,striped bow,ball,small breasts,looking at viewer,hands up,school uniform,green bow` |
|         反向提示词          |                                                                                                     `EasyNegative,(worst quality:2),(low quality:2),(normal quality:2),lowres,normal_quality,((monochrome)),((grayscale)),skin_spots,skin_blemishes,age_spot,signature,((watermark)),text,((bad_hands)),bad_anatomy,verybadimagenegative_v1.3,card`                                                                                                      |
|      生成步数（Steps）      |                                                                                                                                                                                                                           `26`                                                                                                                                                                                                                           |
|      采样器（Sampler）      |                                                                                                                                                                                                                        `Euler a`                                                                                                                                                                                                                         |
|     时间表（Schedule）      |                                                                                                                                                                                                                       `Automatic`                                                                                                                                                                                                                        |
| 提示词引导系数（CFG scale） |                                                                                                                                                                                                                           `7`                                                                                                                                                                                                                            |
|          Clip Skip          |                                                                                                                                                                                                                           `2`                                                                                                                                                                                                                            |
|        种子（Seed）         |                                                                                                                                                                                                                       `778692461`                                                                                                                                                                                                                        |
|        大小（Size）         |                                                                                                                                                                                                                        `672x672`                                                                                                                                                                                                                         |
|      模型（Model）名称      |                                                                                                                                                                                                            `qteamixQ_omegaFp16 (39d6af08b2)`                                                                                                                                                                                                             |
|          VAE 名称           |                                                                                                                                                                                                                `animevae.pt (735e4c3a44)`                                                                                                                                                                                                                |
|          Lora 使用          |                                                                                                                                                                                                            `Lora_YuzuFujisawa (f562d289933e)`                                                                                                                                                                                                            |
|   Textual Inversion 使用    |                                                                                                                                                                                                              `EasyNegative (c74b4e810b03)`                                                                                                                                                                                                               |
|   ControlNet Unit 0 参数    |                                                                                                           `Module: reference_adain+attn, Model: None, Weight: 1.0, Resize Mode: Crop and Resize, Processor Res: 512, Threshold A: 0.5, Threshold B: 0.5, Guidance Start: 0.0, Guidance End: 1.0, Pixel Perfect: False, Control Mode: Balanced`                                                                                                           |

## 3. 动画 & 漫画 & 小说角色

分区说明：作品存在另一种演出形式的改编时，以最初出现的形式载体计算

### 3-1 漫画类

#### 3-1-1 宇崎酱想要玩耍

##### # 宇崎花

<div align="center">
  <img src="https://webimage.lufiende.work/UzakiHana-Uzaki-chan_wa_Asobitai.png" alt="UzakiHana-Uzaki-chan_wa_Asobitai" width="200"/>
  <img src="https://webimage.lufiende.work/1752671859405.png" alt="1752671859405" width="200"/>
</div>

|          参数名称           |                                                                                                                            参数数据                                                                                                                            |
| :-------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|         正向提示词          | `1girl,chibi,<lora:uzaki_hana:0.85>,(uh1:1.2),cute colors,pastel colors,full body,standing,shirt,(short hair:1.2),bangs,transparent_background,fang,medium breasts,raglan sleeves,romaji text,clothes writing,long sleeves,denim shorts,(black_pantyhose:1.2)` |
|         反向提示词          |           `EasyNegative,(worst quality:2),(low quality:2),(normal quality:2),lowres,normal_quality,((monochrome)),((grayscale)),skin_spots,skin_blemishes,age_spot,signature,((watermark)),text,((bad_hands)),bad_anatomy,verybadimagenegative_v1.3`           |
|      生成步数（Steps）      |                                                                                                                              `25`                                                                                                                              |
|      采样器（Sampler）      |                                                                                                                           `DPM++ 2M`                                                                                                                           |
|     时间表（Schedule）      |                                                                                                                            `Karras`                                                                                                                            |
| 提示词引导系数（CFG scale） |                                                                                                                              `7`                                                                                                                               |
|          Clip Skip          |                                                                                                                              `2`                                                                                                                               |
|        种子（Seed）         |                                                                                                                          `4156547124`                                                                                                                          |
|        大小（Size）         |                                                                                                                           `640x640`                                                                                                                            |
|      模型（Model）名称      |                                                                                                               `qteamixQ_omegaFp16 (39d6af08b2)`                                                                                                                |
|          VAE 名称           |                                                                                                                   `animevae.pt (735e4c3a44)`                                                                                                                   |
|          Lora 使用          |                                                                                                                  `uzaki_hana (2ca71783605f)`                                                                                                                   |

## Ext. 模型下载地址

底模：`qteamixQ_omegaFp16 (39d6af08b2)` ：

[QteaMix 通用Q版模型 - Omega-fp16 &#124; Stable Diffusion Checkpoint &#124; Civitai](https://civitai.com/models/50696/qteamix-q)

初音未来：`hatsunemiku1 （8ccb2b9adc0a）` ：

[Hatsune Miku 初音ミク &#124; 23 Outfits &#124 Character Lora 9289 - v1.0 &#124; Stable Diffusion LoRA &#124; Civitai](https://civitai.com/models/80848/hatsune-miku-or-23-outfits-or-character-lora-9289)

音击：自炼，敬请期待

宇崎花 `uzaki_hana (2ca71783605f)` ：

[Uzaki Hana 宇崎花 / Uzaki-chan wa Asobitai - v1.0 &#124; Stable Diffusion LoRA &#124; Civitai](https://civitai.com/models/67785/uzaki-hana-uzaki-chan-wa-asobitai)




持续更新中……
