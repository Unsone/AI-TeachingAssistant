const express = require("express")
const multer = require("multer")
const cors = require("cors")
const path = require("path")

// 创建Express应用
const app = express()
// 允许跨域请求（前端和后端端口不同时需要）
app.use(cors())
// 解析JSON格式的请求体
app.use(express.json())
// 静态文件托管（让前端能访问uploads里的图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// 提供静态HTML文件
app.use(express.static('.'))

// 配置multer，处理文件上传（指定存储路径+保留原文件名）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads') // 图片存在uploads文件夹
  },
  filename: function (req, file, cb) {
    // 保留原文件名，避免重复（比如 "math-homework.png"）
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage })

// 模拟数据库（实际开发用MySQL/MongoDB，这里先用数组模拟）
let homeworks = []
let homeworkId = 1

// 1. 学生上传作业接口
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("请选择要上传的图片！")
  }
  // 模拟存储作业信息（实际要存到数据库）
  const homework = {
    id: homeworkId++,
    student_id: 1, // 模拟学生ID=1
    image_path: `/uploads/${req.file.filename}`, // 图片访问路径
    ai_score: Math.floor(Math.random() * 20) + 80, // 模拟AI评分（80-100）
    teacher_score: null,
    status: "ai_scored",
    submit_time: new Date().toLocaleString()
  }
  homeworks.push(homework)
  res.json({
    code: 200,
    msg: "作业提交成功！",
    data: homework
  })
})

// 2. 获取所有作业列表（教师端）
app.get("/homeworks", (req, res) => {
  res.json(homeworks)
})

// 3. 教师修改评分接口
app.post("/score", (req, res) => {
  const { id, score } = req.body
  if (!id || !score) {
    return res.status(400).send("请输入作业ID和评分！")
  }
  // 找到对应作业，更新教师评分
  const homework = homeworks.find(item => item.id === parseInt(id))
  if (homework) {
    homework.teacher_score = parseInt(score)
    homework.status = "teacher_reviewed"
    res.json({
      code: 200,
      msg: "评分修改成功！",
      data: homework
    })
  } else {
    res.status(404).send("作业不存在！")
  }
})

// 4. 学生获取自己的作业（模拟学生ID=1）
app.get("/my-homework", (req, res) => {
  const myHomework = homeworks.filter(item => item.student_id === 1)
  res.json(myHomework)
})

// 5. 学生提交反馈接口
app.post("/feedback", (req, res) => {
  const { homework_id, content } = req.body
  if (!homework_id || !content) {
    return res.status(400).send("请输入作业ID和反馈内容！")
  }
  res.json({
    code: 200,
    msg: "反馈提交成功！",
    data: {
      homework_id,
      student_id: 1,
      content,
      time: new Date().toLocaleString()
    }
  })
})

// 启动服务器
// 👇 新增：定义首页根路径，解决 Cannot GET / 问题
app.get("/", (req, res) => {
  res.send(`
    <h1>作业上传服务器已启动成功！🎉</h1>
    <p>可用接口：</p>
    <ul>
      <li>上传作业：POST /upload</li>
      <li>查看所有作业：GET /homeworks</li>
      <li>教师评分：POST /score</li>
      <li>我的作业：GET /my-homework</li>
    </ul>
  `);
});

// 👇 下面是你原本的启动代码，不用动
const port = 3000
app.listen(port, () => {
  console.log(`服务器已启动，访问地址：http://localhost:${port}`)
})