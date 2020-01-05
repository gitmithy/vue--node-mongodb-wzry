module.exports = app => {
    const express = require("express")
    const router = express.Router({
        mergeParams: true  // 合并url参数
    })
  
    // 通用新增接口
    router.post('/', async (req, res) => {
      const model = await req.Model.create(req.body)
      res.send(model)
    })
    // 通用修改接口
    router.put('/:id', async (req, res) => {
      const model = await req.Model.findByIdAndUpdate(req.params.id, req.body)
      res.send(model)
    })
    // 通用删除接口
    router.delete('/:id', async (req, res) => {
      await req.Model.findByIdAndDelete(req.params.id)
      res.send({
        success: true
      })
    })
    // 通用获取列表接口
    router.get('/', async (req, res) => {

        const queryOptions = {}
        // 为了通用性，这里不单独写Category的接口，因为Category要特殊获取上级分类，
        // 所以这里将它设置为动态参数传进去，以后类似的特殊请求都可以这样处理
      if (req.Model.modelName === 'Category') {
        queryOptions.populate = 'parent'
      }
      const items = await req.Model.find().setOptions(queryOptions).limit(30)
      res.send(items)
    })
    // 通用获取一条数据接口
    router.get('/:id', async (req, res) => {
      const model = await req.Model.findById(req.params.id)
      res.send(model)
    })



    app.use('/admin/api/rest/:resource', async (req, res, next) => {// “resource”为动态参数，用来匹配相应资源
      const modelName = require('inflection').classify(req.params.resource)// 请求动态资源  这里需要安装一个inflection依赖包，用于类名转换
      req.Model = require(`../../models/${modelName}`)
      next()
    }, router)
  
  
  
  // 图片上传接口
  const multer = require('multer')// 导入上传文件中间件的依赖包，需要先安装
  const upload = multer({dest:__dirname + '/../../uploads'})// 上传中间件
  app.post('/admin/api/upload',upload.single('file'), async (req, res) => { 
    const file = req.file
    file.url = `http://localhost:3000/uploads/${file.filename}`
    res.send(file)
  })


  // 登录接口
  app.post('/admin/api/login',async (req, res) => { 
    const { username, password } = req.body;
    // 1.根据用户名找用户
    const AdminUser = require('../../models/AdminUser')
    const user = await AdminUser.findOne({username}).select('+password')
    if (!user) {
      return res.status(422).send({
        message: '用户不存在！'
      })
    }
    // 2.校验密码
    const isValid = require('bcryptjs').compareSync(password, user.password)
    if (!isValid) {
      return res.status(422).send({
        message: '密码错误！'
      })
    }
    // 3.返回token
    const jwt = require('jsonwebtoken')
    const token = jwt.sign({ id: user._id}, app.get('secret'))
    res.send({user,token})
  })

  }