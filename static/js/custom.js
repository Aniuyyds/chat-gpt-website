// 封装弹窗layer组件等
var common_ops = {
  alert:function( msg ,cb ){
      layer.alert( msg,{
          yes:function( index ){
              if( typeof cb == "function" ){
                  cb();
              }
              layer.close( index );
          }
      });
  },
  confirm:function( msg,callback ){
      callback = ( callback != undefined )?callback: { 'ok':null, 'cancel':null };
      layer.confirm( msg , {
          btn: ['确定','取消'] //按钮
      }, function( index ){
          //确定事件
          if( typeof callback.ok == "function" ){
              callback.ok();
          }
          layer.close( index );
      }, function( index ){
          //取消事件
          if( typeof callback.cancel == "function" ){
              callback.cancel();
          }
          layer.close( index );
      });
  },
  tip:function( msg,target ){
      layer.tips( msg, target, {
          tips: [ 3, '#e5004f']
      });
      $('html, body').animate({
          scrollTop: target.offset().top - 10
      }, 100);
  }
};


// 功能
$(document).ready(function() {
  var chatBtn = $('#chatBtn');
  var chatInput = $('#chatInput');
  var chatWindow = $('#chatWindow');

  // 存储对话信息,实现连续对话
  var messages = []

  // 转义html代码，防止在浏览器渲染
  function escapeHtml(html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  }

  // 添加消息到窗口
  function addMessage(message,imgName) {
    $(".answer .tips").css({"display":"none"});    // 打赏卡隐藏
    chatInput.val('');
    var escapedMessage;
    if (imgName == "avatar.png"){
      escapedMessage= escapeHtml(message);  // 对请求message进行转义，防止输入的是html被浏览器渲染
    }else if(imgName == "chatgpt.png"){
      escapedMessage= marked(message);  // 使用marked.js对响应message的markdown格式转换为html
    }
    var messageElement = $('<div class="row message-bubble"><img class="chat-icon" src="./static/images/' + imgName + '"><div class="message-text">' +  escapedMessage + '</div></div>');
    chatWindow.append(messageElement);
    chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 500);
  }


  // 请求失败不用转义html
  function addFailMessage(message) {
    $(".answer .tips").css({"display":"none"});      // 打赏卡隐藏
    chatInput.val('');
    var messageElement = $('<div class="row message-bubble"><img class="chat-icon" src="./static/images/chatgpt.png"><p class="message-text">' +  message + '</p></div>');
    chatWindow.append(messageElement);
    chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 500);
  }
  
  // 处理用户输入
  chatBtn.click(function() {
    // 解绑键盘事件
    chatInput.off("keydown",handleEnter);
    
    // 保存api key与对话数据
    var data = {
      "apiKey" : "", // 这里填写固定 apiKey
    }
   
    // 判断是否使用自己的api key
    if ($(".key .ipt-1").prop("checked")){
      var apiKey = $(".key .ipt-2").val();
      if (apiKey.length < 20 ){
          common_ops.alert("请输入正确的 api key ！",function(){
            chatInput.val('');
            // 重新绑定键盘事件
            chatInput.on("keydown",handleEnter);
          })
          return
      }else{
        data.apiKey = apiKey
      }

    }

    var message = chatInput.val();
    if (message.length == 0){
      common_ops.alert("请输入内容！",function(){
        chatInput.val('');
        // 重新绑定键盘事件
        chatInput.on("keydown",handleEnter);
      })
      return
    }else{
      message = message
    }


    addMessage(message,"avatar.png");

    // 将用户消息保存到数组
    messages.push({"role": "user", "content": message})

    // 收到回复前让按钮不可点击
    chatBtn.attr('disabled',true)

    data.prompt = messages

    // 发送信息到后台
    $.ajax({
      url: 'https://open.aiproxy.xyz/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + data.apiKey
      },
      data: JSON.stringify({
        "messages": data.prompt,
        "model": "gpt-3.5-turbo",
        "max_tokens": 2048,
        "temperature": 0.5,
        "top_p": 1,
        "n": 1
      }),
      success: function(res) {
        const resp = res["choices"][0]["message"];
       
        addMessage(resp.content,"chatgpt.png");
        // 收到回复，让按钮可点击
        chatBtn.attr('disabled',false)
        // 重新绑定键盘事件
        chatInput.on("keydown",handleEnter);
        // 将回复添加到数组
        messages.push(resp)
      },
      error: function(jqXHR, textStatus, errorThrown) {
        addFailMessage('<span style="color:red;">' + '出错啦！请稍后再试!' + '</span>');
        chatBtn.attr('disabled',false)
        chatInput.on("keydown",handleEnter);
        messages.pop() // 失败就让用户输入信息从数组删除
      }
    });
  });

  // Enter键盘事件
  function handleEnter(e){
    if (e.keyCode==13){
      chatBtn.click();
    }
  }

  // 绑定Enter键盘事件
  chatInput.on("keydown",handleEnter);
  
  // 禁用右键菜单
  document.addEventListener('contextmenu',function(e){
    e.preventDefault();  // 阻止默认事件
  });

  // 禁止键盘F12键
  document.addEventListener('keydown',function(e){
    if(e.key == 'F12'){
        e.preventDefault(); // 如果按下键F12,阻止事件
    }
  });
});
