import { createServer, IncomingMessage } from 'http'
import { DumpedRecord, login, upload } from './api'
import fs from 'fs'

if (!fs.existsSync('dump.json')) throw new Error('dump.json is not exists!')
const dumpData = JSON.parse(fs.readFileSync('dump.json', 'utf-8')) as DumpedRecord[]
if (!dumpData.length) throw new Error('dump.json is empty!')
if (!fs.existsSync('users.json')) fs.writeFileSync('users.json', '{}')
const users = JSON.parse(fs.readFileSync('users.json', 'utf-8')) as Record<string, any>

const index = fs.readFileSync('index.html', 'utf-8')

const getBody = <T>(req: IncomingMessage, cb: (err: Error | null, ret?: T) => void) => {
  const arr: Buffer[] = []
  req.on('error', cb).on('data', chunk => arr.push(chunk)).on('end', () => {
    try { cb(null, JSON.parse(Buffer.concat(arr).toString())) } catch (e: any) { cb(e) }
  })
}

createServer((request, response) => {
  switch (request.url) {
    case '/':
      response.end(index)
      return
    case '/upload': {
      const date = new Date()
      const hour = date.getHours()
      const log = (...args: any[]) => console.log(date.toLocaleTimeString(), ...args)
      if (hour < 6 || hour > 23) {
        response.end('不在服务时间段内!')
        log('不在服务时间段内!')
        return
      }
      getBody<{ name: string, password: string }>(request, (err, ret) => {
        if (err || !ret) return response.end('发生错误: ' + (err ? err.message : ''))
        if (!ret.name || ret.name.length !== 12) return response.end('错误的学号格式!')
        if (!ret.password || ret.password.length < 3) return response.end('错误的密码格式!')
        if (!(ret.name in users)) {
          response.end('你不在白名单列表里!')
          log(ret.name, '你不在白名单列表里!')
          return
        }
        log(ret.name, '尝试上传记录.')
        login(ret.name, ret.password)
          .then(it => {
            const data = dumpData[dumpData.length * Math.random() | 0]
            data.sportTime = `00:${20 + Math.random() * 20 | 0}:${10 + Math.random() * 50 | 0}`
            data.sportRange = 4 + Math.random() * 2
            return upload(it.id, it.token, data)
          })
          .then(it => {
            response.end(it)
            log(ret.name, it)
          })
          .catch(e => {
            response.end('发生错误: ' + (e.message || e))
            log(ret.name, '发生错误:', e)
          })
      })
    }
  }
}).listen(45256, () => console.log('Started!', users))
