<div align="center">
<img alt="logo" height="120" src="./public/favicon.png" width="120"/>
<h2>今日热榜</h2>
<p>一个聚合热门数据的 API 接口</p>
<br />

## 🚩 特性

- 极快响应，便于开发
- 支持 RSS 模式和 JSON 模式
- 支持多种部署方式
- 简明的路由目录，便于新增

## Docker 部署
安装及配置 Docker 将不在此处说明，请自行解决

### 
#### 本地构建
docker build -t dailyhot-api .

#### 运行
docker run --restart always -p 6688:6688 -d dailyhot-api


## 安装

```bash
git clone git@github.com:hulanhui/dailyhot-api.git
cd dailyhot-api
```

然后再执行安装依赖

```bash
npm install
```

复制 `/.env.example` 文件并重命名为 `/.env` 并修改配置

## 开发

```bash
npm run dev
```

成功启动后程序会在控制台输出可访问的地址

#### 编译运行

```bash
npm run build
npm run start
```

### pm2 部署

```bash
npm i pm2 -g
sh ./deploy.sh
```