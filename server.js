const express = require("express")
const multer = require("multer")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

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

// 加载学生数据库
let students = []
function loadStudents() {
  try {
    const data = fs.readFileSync('./students.json', 'utf8')
    students = JSON.parse(data)
    console.log(`已加载 ${students.length} 个学生记录`)
  } catch (err) {
    console.error('加载学生数据库失败：', err.message)
    students = []
  }
}

// 初始化加载学生数据
loadStudents()

// 模拟数据库（实际开发用MySQL/MongoDB，这里先用数组模拟）
let homeworks = []
let homeworkId = 1
let feedbacks = []
let feedbackId = 1
let answerSettings = {
  reference_answer: "",
  prompt: ""
}

// 1. 学生上传作业接口（支持图片和文本）
app.post("/upload", upload.single("image"), (req, res) => {
  const { text, student_name, student_id } = req.body
  if (!req.file && !text) {
    return res.status(400).send("请提交图片或文本作业！")
  }
  if (!student_id || !student_name) {
    return res.status(400).send("请输入学号和姓名！")
  }
  // 验证学号和姓名匹配
  const student = students.find(s => s.student_id === student_id && s.name === student_name)
  if (!student) {
    return res.status(400).send("学号和姓名不匹配，请检查输入！")
  }
  // 模拟存储作业信息（实际要存到数据库）
  const homework = {
    id: homeworkId++,
    student_id: student_id,
    student_name: student_name,
    image_path: req.file ? `/uploads/${req.file.filename}` : null,
    text_content: text || null,
    ai_score: Math.floor(Math.random() * 20) + 80, // 模拟AI评分（80-100）
    teacher_score: null,
    status: "ai_scored",
    submit_time: new Date().toLocaleString(),
    feedbacks: []
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

// 4. 学生获取自己的作业（根据学号）
app.get("/my-homework", (req, res) => {
  const { student_id } = req.query
  if (!student_id) {
    return res.status(400).send("请提供学号！")
  }
  const myHomework = homeworks.filter(item => item.student_id === student_id)
  res.json(myHomework)
})

// 6. 设置参考答案和提示词
app.post("/set-answer", (req, res) => {
  const { reference_answer, prompt } = req.body
  answerSettings.reference_answer = reference_answer || ""
  answerSettings.prompt = prompt || ""
  res.json({
    code: 200,
    msg: "设置成功！",
    data: answerSettings
  })
})

// 7. 获取参考答案和提示词
app.get("/get-answer", (req, res) => {
  res.json(answerSettings)
})

// 8. 获取所有反馈
app.get("/feedbacks", (req, res) => {
  const allFeedbacks = []
  homeworks.forEach(hw => {
    allFeedbacks.push(...hw.feedbacks)
  })
  res.json(allFeedbacks)
})
      time: new Date().toLocaleString()

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
      <li>我的作业：GET /my-homework?student_id=学号</li>
      <li>提交反馈：POST /feedback</li>
      <li>设置答案：POST /set-answer</li>
      <li>获取答案：GET /get-answer</li>
      <li>获取反馈：GET /feedbacks</li>
    </ul>
    <p>学生数据库：从 students.json 加载，共 ${students.length} 个学生</p>
  `);
});

// 👇 下面是你原本的启动代码，不用动
const port = 3000
app.listen(port, () => {
  console.log(`服务器已启动，访问地址：http://localhost:${port}`)
})