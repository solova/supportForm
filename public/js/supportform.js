(function($, window){

    if ( window.SupportForm !== undefined ) return;

    window.SupportForm = (function(){

        ///*! Микрошаблонизатор Tim (lite) github.com/premasagar/tim
        var tim=function(){var e=/{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;return function(f,g){return f.replace(e,function(h,i){for(var c=i.split("."),d=c.length,b=g,a=0;a<d;a++){b=b[c[a]];if(b===void 0)throw"tim: '"+c[a]+"' not found in "+h;if(a===d-1)return b}})}}();
        
        var options = {
            "label": "Технічна підтримка", //заголовок окна чата
            "username": "Я", //имя пользователя
            "supportname": "Помічник", //имя сотрудника техподдержки
            "maxlength": 2048, //максимальная длина сообщения в чате
            "role": "user",
            "connect": false//,
            //"zoom": 0.5 //коэфициент отображения viewport пользователя
        };

        //шаблоны
        var templates = {
            main: '<div id="support-form"><div class="support-form-title active"><div class="support-form-status">&bull;</div> ' + options.label + '<a class="support-form-minimize" href="#">_</a><a class="support-form-close" href="#">X</a></div><div class="support-form-chat"></div><div class="support-form-textarea"><textarea></textarea></div></div>',
            message: '<div class="support-form-message"><div class="support-form-message-head"><div class="support-form-author {{classname}}">{{name}}</div><div class="support-form-time">{{time}}</div></div><div class="support-form-message-body">{{body}}</div></div>',
            separator: '<hr />',
            preview: '<img alt="" src="{{src}}" />',
            viewport: '<div class="support-form-viewport"></div>'
        };

        var loadDfd = $.Deferred(); //состояние загрузки
        var socket = io.connect('http://localhost:8080'); //сокет к node.js

        var supportForm = $(templates.main);
        var total = 0;

        //private-функции, хелперы
        var getTime = function(){
            var date = new Date();
            return ('00'+date.getHours()).substr(-2) + ':' + ('00'+date.getMinutes()).substr(-2);
        }

        var prepare = function(str){
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([^>])\n/g, '$1<br/>');
        }

        var printscreen = function(callback){
            html2canvas( [ document.body ], {
                onrendered: callback
            });
        }

        var addMessage = function(params){
            var chat = $(".support-form-chat", supportForm);
            $.extend(params, { time: getTime() });
            
            var message = tim(templates.message, params);
            if (total++ > 0) { 
                $(chat).append(templates.separator);
            }
            $(chat).append(message);
            $(chat).scrollTop($(chat)[0].scrollHeight);
        }
        
        $(function(){
            if(options.role == 'support') $("body").append(templates.viewport);
            supportForm.addClass("minimized");

            $("body").append(supportForm);


            //события

            $(".support-form-viewport").live("click", function(e){
                console.log("image click", e);
                var pos = { x: e.layerX, y: e.layerY };
                socket.emit('message', { author: 'support', body: pos, type: 3 });
            })

            $(".support-form-minimize, .support-form-title", supportForm).click(function(e){
                e.stopPropagation();
                supportForm.toggleClass("minimized");


                if (options.role=='user' && (options.connect==false) && (supportForm.hasClass("minimized")==false)){
                    socket.emit('message', { author: options.role, body: "request", type: 9 });  
                    addMessage({
                        name: 'Системне повідомлення',
                        body: 'Запит підтримки. Почекайте',
                        classname:''
                    })
                }
            });

            $(".support-form-close", supportForm).click(function(e){
                e.stopPropagation();
                supportForm.hide();
            });

            $("textarea", supportForm).keydown(function(e){

                if (options.connect == false) return false;
                
                if ((e.keyCode==13) && (e.shiftKey == false)){

                    if ($(this).val().length > options.maxlength) {
                        alert("Занадто велике повідомлення");
                        return false;
                    }

                    var str = $(this).val();

                    socket.emit('message', { author: options.role, body: str, type: 1 });
                    
                    if (options.role == 'user'){
                        printscreen(function( canvas ) { 
                            //асинхронно, но нам синхронность здесь и не нужна
                            socket.emit('message', { author: options.role, body: canvas.toDataURL('image/png'), type: 2 });
                        });
                    }

                    addMessage({
                        name: options.username,
                        body: prepare(str),
                        classname: 'support-form-self'
                    });

                    $(this).val('');

                    return false;
                }
            });

            //прослушивание сокета
            socket.on('message', function (message) {

                switch(message.type){
                    case 1:
                        addMessage({
                            name: message.author,
                            body: message.body,
                            classname: ''
                        });
                        break;
                    case 2:
                        var preview = tim(templates.preview, {src: message.body, zoom: (options.zoom * 100 + '%')});
                        $(".support-form-viewport").html(preview);
                        break;
                    case 3:
                        var hint = $("<img>");
                        var timeout = setTimeout(function(){hint.fadeOut('slow')}, 5000);

                        hint.attr("src", "target.gif");
                        hint.css({ left: 0, top: 0, position: 'absolute'});
                        
                        hint.click(function(){ clearTimeout(timeout); hint.remove() });

                        $("body").append(hint);
                        console.log("HINT", message.body);
                        hint.animate({
                            left: message.body.x,
                            top: message.body.y
                        });

                        $('html, body').animate({
                             scrollTop: (message.body.y > 400) ? (message.body.y - 400) : 0
                        }, 2000);
                        break;
                    case 9:

                        if(options.role=='support'){
                            var req = confirm("Користувач викликає по домомогу. Натисніть ОК, щоб розпочати чат.");
                            if(req){
                                supportForm.removeClass("minimized");
                                socket.emit('message', { author: options.role, body: "response", type: 9 });  
                                options.connect = true;
                            }
                        }else if(options.role=='user'){
                            addMessage({
                                name: 'Системне повідомлення',
                                body: 'Підтримка на зв\'язку',
                                classname:''
                            })
                            options.connect = true;
                        }
                }
            })
        });

        var exports = {
            "isload": function() { return loadDfd.promise() },
            "setrole": function(role) { options.role = role; } 
        };

        var run = function(){
            exports.show = function(){
                supportForm.removeClass("minimized").show();
            }
            loadDfd.resolve();
        }

        if ( window.html2canvas === undefined) {
            $.getScript("js/html2canvas.min.js", run);
        } else {
            run();
        }

        return exports;
    })();

})(jQuery, window);