const fs = require('fs')
const OSS = require('ali-oss')
const chalk = require('chalk')
const path = require('path')
/**
 * 自动上传oss
 * config: oss 配置项 = 》 {
    region,
    accessKeyId,
    accessKeySecret,
    bucket
  }
 * local: 本地地址 需要上传的文件目录位置
 * osspath: 远端oss的上传目录 例如： test / demo 则文件上传到oss的test / demo的目录下面
 * @param {*} {config, local, path}
 */
function uploadToOss({
  config,
  local,
  osspath
}) {
  const client = new OSS(config)
  const webpath = osspath
  const prePath = local
  let log = console.log
  let ckwran = chalk.yellow
  let ckerr = chalk.red
  let success = chalk.green

  let fileCount = 0 // 计算文件个数
  // 核心方法   获取文件并上传
  function getFile(filePath) {
    // 根据文件路径读取文件，返回文件列表
    fs.readdir(filePath, function (err, files) {
      if (err) {
        log(ckwran(err))
      } else {
        // 遍历读取到的文件列表
        files.forEach(function (filename) {
          // 获取当前文件的绝对路径
          var filedir = path.join(filePath, filename)
          // 根据文件路径获取文件信息，返回一个fs.Stats对象
          fs.stat(filedir, function (eror, stats) {
            if (eror) {
              log(ckerr('获取文件stats失败'))
            } else {
              var isFile = stats.isFile() // 是文件
              var isDir = stats.isDirectory() // 是文件夹

              if (isFile) {
                var url = filedir.replace(prePath, '').replace(/\\/g, '/')
                put({
                  filePath: filedir,
                  filename,
                  url: url
                }, function (data) {
                  ++fileCount
                  log(success(
                    `上传成功 ${fileCount} => ${data.replace(/^\//, '')}`
                  ))
                })
              }
              if (isDir) {
                getFile(filedir) // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
              }
            }
          })
        })
      }
    })
  }
  // 上传文件方法   oss 提供
  async function put(option, fn) {
    try {
      await client.put((`${webpath}` + option.url).replace(/\/+/g, '/'), option.filePath)
      await fn(option.url)
    } catch (e) {
      console.log(e)
    }
  }
  getFile(local)
}

module.exports = uploadToOss
