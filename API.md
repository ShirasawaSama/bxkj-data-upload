# BXKJ API

## 全部请求

### 时间戳

每个请求的参数都应该加上时间戳

如 `timestamp=1605760516909`

### 签名

创建一个链表, 将全部已有的参数加入进去, 然后再加上以上键值对

```
appId: 如果请求的url是 https://m.boxkj.com 则为move, 如果是陕科大则为 ec74df4f7ea14f1fb585bbc9f936fc23, 其他学校自己安排
timestamp: 上文的时间戳
appSecret: e8167ef026cbc5e456ab837d9d6d9254
```

之后再将全部的键值对根据键的字母顺序进行排序, 之后使用 `querystring` 方式对键值对进行编码.

最后再对编码后的字符串求 `MD5` 值, 就是最终的签名了, 麻烦的一比

示例代码 (NodeJS):

```js
const crypto = require('crypto')
const sign = (data, timestamp, appId = 'ec74df4f7ea14f1fb585bbc9f936fc23') => {
  const d = { ...data, timestamp, appId, appSecret: 'e8167ef026cbc5e456ab837d9d6d9254' }
  return crypto.createHash('md5').update(Object.keys(d).sort().map(k => k + '=' + d[k]).join('&')).digest('hex')
}
```

## 登录

```
POST https://sxkd.boxkj.com/app/appstu/login HTTP/1.1
token: <空>
channel: Android
version: 1490
type: 0
Content-Type: application/x-www-form-urlencoded
Host: sxkd.boxkj.com
User-Agent: okhttp/3.11.0
```

### 参数

uname=<学号>&pwd=<密码>

#### 密码

使用 `RSA/ECB/PKCS1Padding (pkcs1)` 加密, 然后再 `Base64` 一波, 公钥如下 (类型 `pkcs8-public`):

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq4laolA7zAk7jzsqDb3O
a5pS/uCPlZfASK8Soh/NzEmry77QDZ2koyr96M5Wx+A9cxwewQMHzi8RoOfb3UcQ
O4UDQlMUImLuzUnfbk3TTppijSLH+PU88XQxcgYm2JTa546c7JdZSI6dBeXOJH20
quuxWyzgLk9jAlt3ytYygPQ7C6o6ZSmjcMgE3xgLaHGvixEVpOjL/pdVLzXhrMqW
VAnB/snMjpCqesDVTDe5c6OOmj2q5J8n+tzIXtnvrkxQSDaUp8DWF8meMwyTErmY
klMXzKic2rjdYZpHh4x98Fg0Q28sp6i2ZoWiGrJDKW29mntVQQiDNhKDawb4B45z
UwIDAQAB
-----END PUBLIC KEY-----
```

### 返回值

```json
{"total":0,"data":{"userNum":"学号","sex":1,"name":"姓名","id":用户ID,"token":"TOKEN"},"returnCode":"200","returnMsg":"登录成功！","returnData":null}
```

## 获取跑步和场地等信息

```
POST https://sxkd.boxkj.com/app/sportRecordSetting/getSetting HTTP/1.1
token: <TOKEN>
channel: Android
version: 1490
type: 0
Content-Type: application/x-www-form-urlencoded
Host: sxkd.boxkj.com
User-Agent: okhttp/3.11.0
```

### 参数

```
runType=2&uid=<用户ID>
```

### 返回值

```json
{
  "total": 0,
  "data": {
    "runType": 2,
    "middleFaces": [],
    "isClock": 0,
    "totalRange": 2.0,
    "identify": "这个之后需要用到",
    "faceTimeout": 10,
    "faceDistanceOut": 0.1,
    "startQualifiedTime": 3,
    "endQualifiedTime": 20,
    "pattern": 2,
    "list": [],
    "context": "公告",
    "surplusNum": 1111,
    "geofence": [<场地信息, 没卵用>]
  },
  "returnCode": "200",
  "returnMsg": null,
  "returnData": null
}
```

## 开始跑步

```
POST https://sxkd.boxkj.com/app/sportRecordSetting/getRunningStartTime HTTP/1.1
token: <TOKEN>
channel: Android
version: 1490
type: 0
Content-Type: application/x-www-form-urlencoded
Host: sxkd.boxkj.com
User-Agent: okhttp/3.11.0
```

### 参数

```
identify=<结束跑步需要使用到的ID>
```

### 返回值

```json
{"total":0,"data":{"startTime":1605723146222},"returnCode":"200","returnMsg":"跑步开始时间","returnData":null}
```

## 上传跑步信息

```
POST https://sxkd.boxkj.com/app/appSportRecord/appAddSportRecord HTTP/1.1
token: <TOKEN>
channel: Android
version: 1490
type: 0
Content-Type: application/x-www-form-urlencoded
Host: sxkd.boxkj.com
User-Agent: okhttp/3.11.0
```

### 参数

```
userId=<用户ID>&runType=2&startTime=<开始时间戳>&endTime=<结束时间戳>&gitudeLatitude=<路径信息>&identify=<跑步ID>&formatSportTime=<格式化后的总运动时间>&formatSportRange=<格式化后的运动路程>&avgspeed=<平均速度>&speed=<速度>&okPointList=%5B%5D&brand=<手机制造厂商>&model=<手机型号>&system=Android&version=7.1.2&appVersion=1.4.9&stepNumbers=<步数>&isFaceStatus=0&uploadType=0
```

#### gitudeLatitude

```json
[
  {
    "latitude": 34.271523422642694,
    "locationType": 1,
    "longitude": 108.94665622088462,
    "puase": false,
    "speed": 0.02,
    "time": 1605723155797
  },
  {
    "latitude": 34.2715238430086,
    "locationType": 1,
    "longitude": 108.94665633122113,
    "puase": true,
    "speed": 0.02,
    "time": 1605723157669
  }
]
```

#### formatSportTime

如 `00:20:00`

#### formatSportRange

如 `1.000`

#### speed

如 `0'00"`

#### stepNumbers

### 返回值

```json
{"total":0,"data":null,"returnCode":"200","returnMsg":"跑步记录保存成功！","returnData":null}
```

## 获取之前跑的步的列表

```
POST https://sxkd.boxkj.com/app/appSportRecord/appSportRecordList HTTP/1.1
token: <TOKEN>
channel: Android
version: 1490
type: 0
Content-Type: application/x-www-form-urlencoded
Host: sxkd.boxkj.com
User-Agent: okhttp/3.11.0
```

### 参数

```
userId=<用户ID>&sportType=2&pageIndex=1&pageSize=10
```

### 返回值

```json
{
  "total": 1,
  "data": {
    "data": [
      {
        "id": ID,
        "startTime": "2020-11-19 02:12:35",
        "endTime": "2020-11-19 02:12:42",
        "sportRange": "0.0KM",
        "sportTime": "00:00:01",
        "sportStatus": 0,
        "remark": "距离不符合！",
        "uploadType": "正常提交",
        "addTime": "2020-11-19 02:12:48",
        "sysUserUserNum": "学号",
        "sysUserName": "姓名",
        "sysTermName": "2020-2021学年第1学期",
        "model": "手机型号",
        "system": "Android",
        "version": "7.1.2",
        "appVersion": "1.4.9",
        "brand": "手机厂商",
        "week": 11,
        "sportType": 2,
        "stepNumbers": [0],
        "reachRange": "0.0KM",
        "enable": "true",
        "va": "我要申诉"
      },
      {
        "id": ID,
        "startTime": "2020-11-13 16:50:27",
        "endTime": "2020-11-13 17:11:35",
        "sportRange": "3.624KM",
        "sportTime": "00:17:20",
        "sportStatus": 1,
        "remark": "合格",
        "uploadType": "正常提交",
        "addTime": "2020-11-13 17:11:37",
        "sysUserUserNum": "学号",
        "sysUserName": "姓名",
        "sysTermName": "2020-2021学年第1学期",
        "model": "手机型号",
        "system": "Android",
        "version": "9",
        "appVersion": "1.4.9",
        "brand": "手机厂商",
        "week": 10,
        "sportType": 2,
        "stepNumbers": [<步数信息>],
        "reachRange": "3.624KM"
      }
    ],
    "count": 1,
    "isShowFreedom": 0,
    "isShowMorningRun": 0,
    "isShowSunRun": 1,
    "succeed": 13,
    "noSucceed": 6
  },
  "returnCode": "200",
  "returnMsg": null,
  "returnData": null
}
```

## 查看单次跑步数据

```
POST https://sxkd.boxkj.com/app/appSportRecord/getSportRecordId HTTP/1.1
token: <TOKEN>
channel: Android
version: 1490
type: 0
Content-Type: application/x-www-form-urlencoded
Host: sxkd.boxkj.com
User-Agent: okhttp/3.11.0
```

### 参数

```
sportRecordId=<跑步记录ID>
```

### 返回值

```json
{
  "total": 0,
  "data": {
    "id": 跑步记录ID,
    "startTime": "2020-11-13 16:50:27",
    "endTime": "2020-11-13 17:11:35",
    "sportRange": 3.624,
    "addTime": "2020-11-13 17:11:37",
    "sportTime": "00:17:20",
    "okPointList": [],
    "sysUserUserNum": "学号",
    "sysUserName": "姓名",
    "userImg": "",
    "bgCutImg": "",
    "gitudeLatitude": [<一大堆坐标数据>],
    "sportStatus": 1,
    "avgspeed": 12.54,
    "speed": "04'47\"",
    "remark": "合格",
    "sysTermName": "2020-2021学年第1学期",
    "stepNumbers": [<步数信息>],
    "geofence": [<场地信息, 没卵用>]
  },
  "returnCode": "200",
  "returnMsg": null,
  "returnData": null
}
```
