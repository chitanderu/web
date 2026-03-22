# 余白 / Yohaku

这是 [Yohaku](https://github.com/Innei/Yohaku) 设计语言的闭源完整实现，源自 [Shiro](https://github.com/Innei/Shiro) 但已在设计语言、交互体系和视觉哲学上完全重构。赞助后可获得访问权限，详见 [Yohaku OSS 仓库](https://github.com/Innei/Yohaku)。

## 关于版本

> [!NOTE]
> 自 [commit `4fdcc320`](https://github.com/innei-dev/Yohaku/commit/4fdcc320d2304562776aa0477e0a53007a548c1b) 之后，项目对整个设计方向迎来了大改，甚至可以说已经成为了另一个项目。
>
> 如果你想使用之前的设计风格，可以切换到对应的 tag [Shiroi](https://github.com/innei-dev/Yohaku/tree/Shiroi)（[`4fdcc320d2304562776aa0477e0a53007a548c1b`](https://github.com/innei-dev/Yohaku/commit/4fdcc320d2304562776aa0477e0a53007a548c1b)），去使用过去的版本，但旧版本将不再继续维护。
>
> ```bash
> git checkout Shiroi
> ```

## 手动部署方式（私有服务器）

参考：https://github.com/innei-dev/yohaku-deploy-action

## 设计哲学

### 書写·信纸·光影

「余白」取自日文，意为留白——画面中那些有意空出的地方，往往比填满的部分更有分量。

整站以**个人书写**为隐喻。页面像一封徐徐展开的信纸，文字与空白共同构成节奏，内容如手帐般自然散落，而非整齐划一的信息网格。阅读时，你的视线是主角，页面只是背景。

**颜色是克制的。** 浅色模式下，底色接近真实纸张的米白，不刺眼；深色模式沉入暖灰，像夜里开着一盏小灯读信。强调色只在内容本身出现，界面的按钮、导航、边框，都刻意退到不被注意的位置。

**动画是呼吸式的。** 页面随滚动缓缓展开，元素不是弹出来的，而是自然浮现——就像翻开一页新纸。桌面端的某些元素还有轻微的闲置呼吸感，像是静止的东西仍然活着。第一次进入时有完整的入场动效；再次访问则直接呈现，不重复打扰。

**字体是有质感的。** 标题用衬线字体，带一点笔墨的重量；注释与日期以斜体呈现，像信纸角落随手写下的旁白。整体字号偏小，阅读密度低，留给内容足够的呼吸空间。

**交互是低调的。** 没有悬浮的色块，没有跳跃的高亮，悬停时只是颜色微微加深，像纸面被手指轻轻压过。所有的反馈都在说：「我注意到你了」，而不是「快看这里」。

## :whale: 运行

<!-- ### :hammer: 通过预构建运行

```sh
export GH_TOKEN=your_github_token # 你需要提供一个 GitHub Token 可以访问私有的仓库
# 下载预构建
bash ./scripts/download-latest-ci-build-artifact.sh
cd standalone
vim .env # 修改你的 ENV 变量
export PORT=2323
node server.js
``` -->
<!-- 
### :books: 推荐使用 Docker Compose

```sh
mkdir shiro
cd shiro
wget https://raw.githubusercontent.com/Innei-dev/Shiroi/main/docker-compose.yml
wget https://raw.githubusercontent.com/Innei-dev/Shiroi/main/.env.template .env

vim .env # 修改你的 ENV 变量
docker compose up -d

docker compose pull # 后续更新镜像
``` -->

## 许可

2026 Innei. 采用 [MIT](./LICENSE) 和附加条款。
