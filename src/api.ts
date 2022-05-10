import NodeRSA from 'node-rsa'
import axios from 'axios'
import { createHash } from 'crypto'
import { stringify } from 'querystring'

const key = new NodeRSA()
key.importKey(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq4laolA7zAk7jzsqDb3O
a5pS/uCPlZfASK8Soh/NzEmry77QDZ2koyr96M5Wx+A9cxwewQMHzi8RoOfb3UcQ
O4UDQlMUImLuzUnfbk3TTppijSLH+PU88XQxcgYm2JTa546c7JdZSI6dBeXOJH20
quuxWyzgLk9jAlt3ytYygPQ7C6o6ZSmjcMgE3xgLaHGvixEVpOjL/pdVLzXhrMqW
VAnB/snMjpCqesDVTDe5c6OOmj2q5J8n+tzIXtnvrkxQSDaUp8DWF8meMwyTErmY
klMXzKic2rjdYZpHh4x98Fg0Q28sp6i2ZoWiGrJDKW29mntVQQiDNhKDawb4B45z
UwIDAQAB
-----END PUBLIC KEY-----`, 'pkcs8-public')
key.setOptions({ encryptionScheme: 'pkcs1' })

const post = async <T> (url: string, data: any, token = '') => {
  const timestamp = Date.now()
  const d = { ...data, timestamp, appId: 'ec74df4f7ea14f1fb585bbc9f936fc23', appSecret: 'e8167ef026cbc5e456ab837d9d6d9254' } as any
  const res = (await axios.post<{
    returnCode: string
    returnMsg: string
    returnData: null
    total: number
    data: T
  }>(url, stringify({ ...data, timestamp, sign: createHash('md5').update(Object.keys(d).sort().map(k => k + '=' + d[k]).join('&')).digest('hex') }), {
    headers: {
      token,
      channel: 'Android',
      version: '1490',
      type: '0',
      'User-Agent': 'okhttp/3.11.0',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })).data
  if (res.returnCode !== '200') throw new Error(res.returnMsg)
  return res
}

export const login = (studentId: string, password: string) => post<{
  userNum: string
  sex: number
  name: string
  id: number
  token: string
}>('https://sxkd.boxkj.com/app/appstu/login', { uname: studentId, pwd: key.encrypt(password, 'base64') }).then(it => it.data)

export interface DumpedRecord {
  sportRange: number
  sportTime: string
  speed: string
  avgspeed: number
  okPointList: any[]
  gitudeLatitude: Array<{ latitude: number, locationType: number, longitude: number, puase: boolean, speed: number, time: number }>
}

export interface RunRecord extends DumpedRecord {
  id: number
  startTime: string
  endTime: string
  addTime: string
  sysUserUserNum: string
  sysUserName: string
  userImg: string
  bgCutImg: string
  sportStatus: number
  remark: string
  sysTermName: string
  stepNumbers: number[]
  geofence: any[]
}

export const upload = async (userId: number, token: string, record: DumpedRecord) => {
  const identify = (await post<{ identify: string }>('https://sxkd.boxkj.com/app/sportRecordSetting/getSetting', { runType: 2, uid: userId }, token)).data.identify
  const endTime = (await post<{ startTime: number }>('https://sxkd.boxkj.com/app/sportRecordSetting/getRunningStartTime', { identify }, token))
    .data.startTime + (Math.random() * 2000 | 0) + 8000
  const arr = record.sportTime.split(':')
  const { returnMsg } = await post('https://sxkd.boxkj.com/app/appSportRecord/appAddSportRecord', {
    userId,
    runType: 2,
    startTime: endTime - ((+arr[0] * 60 + +arr[1]) * 60 + +arr[2]) * 1000,
    endTime,
    gitudeLatitude: JSON.stringify(record.gitudeLatitude),
    identify,
    formatSportTime: record.sportTime,
    formatSportRange: record.sportRange,
    avgspeed: record.avgspeed,
    speed: record.speed,
    okPointList: JSON.stringify(record.okPointList || []),
    brand: 'Mi 10',
    model: 'Xiaomi',
    system: 'Android',
    version: '10',
    appVersion: '1.6.2',
    stepNumbers: JSON.stringify(Array.from({ length: +arr[1] }, () => (130 + Math.random() * 40 | 0))),
    isFaceStatus: 0,
    uploadType: 0,
    points: '[]'
  }, token)
  return `时间: ${record.sportTime}, 距离: ${record.sportRange}km, ${returnMsg}`
}

export const dumpAllData = async (userId: number, token: string) => {
  const result: DumpedRecord[] = []
  const data = await post<{ data: RunRecord[] }>('https://sxkd.boxkj.com/app/appSportRecord/appSportRecordList', { userId, sportType: 2, pageIndex: 1, pageSize: 30 }, token)
  const records = data.data.data.filter(it => it.sportStatus === 1)
  for (const record of records) {
    const d = (await post<RunRecord>('https://sxkd.boxkj.com/app/appSportRecord/getSportRecordId', { sportRecordId: record.id }, token)).data
    if (!d.gitudeLatitude.length) continue
    const time = d.gitudeLatitude[0].time
    d.gitudeLatitude.forEach(it => (it.time -= time))
    result.push({
      sportRange: d.sportRange,
      sportTime: d.sportTime,
      gitudeLatitude: d.gitudeLatitude,
      avgspeed: d.avgspeed,
      speed: d.speed,
      okPointList: d.okPointList
    })
  }
  return result
}
