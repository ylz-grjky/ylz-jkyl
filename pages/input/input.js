const app = getApp();
const _ = require('underscore')
const SMcrypto = require("../../utils/smcrypto.js").SMcrypto
const util = require("../../utils/util.js").util
const record = require("../../utils/util.js").record
var interval
Page({
  data: {
    value:"",
    InputBottom:0,
    CustomBar: app.globalData.CustomBar,
    items: [],
    scrolltop:0,
    color:"blue",
  },
  ////////生命周期函数////////////
  _nextQuestion(msg){
    this._add(msg,"info")
    util.speech({ content:msg}).then((res) => {
      console.log("are you hear??")
    })
  },
  onUnload() {
    console.log("onUnload")
    clearInterval(interval)
  },
  onShow1(){
    this._add("重新定位","location")
    var question1 = ["记录点什么？","有什么可以记录的？"]
    var question2 = ["还有吗？","记录点其他的？","再记录些？","再来一条！"]
    var answerEnd=["可以了","没有了","不用了","就这样","行了"]
    this._nextQuestion(_.sample(question1,1))
    var lastword=""
    this._onVoiceStart()
    //定义一个定时器，每隔2秒检查
    var count=0
    interval = setInterval(()=>{
        console.log(1,lastword,2,this.data.value,3,count,4,interval)
        if (lastword && (lastword==this.data.value))  {//用户暂时停止说话了
          if (count++ >2){ //连续两次停止说话了，可以停止录音了
            this._onVoiceEnd()
          }
          lastword=""
          count = 0
          this._nextQuestion(_.sample(question2,1))
          this._onVoiceStart()
        }else{
          lastword=this.data.value
        }      
    },2000)
  },
  onLoad(){
    let cbRecognize = (res) => {
      let text = res.result
      console.log("识别中的文字：", text)
      this.setData({value:text})
    }
    let cbStop = (res) => {
      console.log("cbStop:",res)
      let text = res.result
      let type
      if (text == '') {
        // 用户没有说话，可以做一下提示处理...
        text = "[没有检测出你的发言]"
        type="info"
      }else{
        type="self"
      }
      console.log("识别出来的文字:", text)
      this._add(text,type)
    }
    record.init(cbRecognize, cbStop)
  },
  /////////////////////////////////////
  _onClear(e){
    this.setData({value:"",items:[]})
  },
  _onFocus(e) {
    this.setData({
      InputBottom: e.detail.height
    })
  },
  _onBlur(e) {
    var value = e.detail.value
    this.setData({ value ,
      InputBottom: 0
    })
    this._add(value,"self")
  },
  _onTouchStart(){
    clearInterval(interval)
    this._onVoiceStart()
  },
  _onTouchEnd(){
    this._onVoiceEnd()
  },
  //zh_CN,en_US,zh_HK,sichuanghua
  _onVoiceStart() {
    record.startRec({
      lang: 'zh_CN',
    })
    this.setData({color:"red"})
  },
  _onVoiceEnd() {
    console.log("voice end")
    record.stopRec()
    this.setData({color:"blue"})
  },  
  _add(msg,type){
    this.data.items.push({msg:msg,type:type,dateTime:(new Date()).toISOString()})
    let value = this.data.value
    console.log("scrolltop:",this.data.items.length*400)
    this.setData({value:"",items:this.data.items,
               scrolltop:this.data.items.length*400})
    if (!value) return
    util.request({
       url:`http://web1.imac1.youht.cc:8084/health/parse/${value}`
     }).then((res)=>{
        console.log("result:",res.data)
        if (JSON.stringify(res.data)=="{}"){
          this.data.items.push({ msg: "抱歉，我没能get到您的意思", type: "info" })
        }else{
          Object.keys(res.data).map(x=>{
            res.data[x].map(y=>{
              this.data.items.push({msg:y, type: x, dateTime: (new Date()).toISOString() })
            })
          })
          //this.data.items.push({msg:res.data.eDate+"-"+res.data.eTime,type:"AI",dateTime:(new Date()).toISOString()})
        }
        this.setData({items:this.data.items,
              "scrolltop":this.data.items.length*400
        })
     }).catch((error)=>{
       console.log(error)
     })
  }
})