function isEmail(string) {
    return string.search(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) != -1;
}

function isURL (string) {
      var regexp = /http:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
      return regexp.test(string);
}


function isValidField(field) {
    isValid = false;
    
    if($(field).hasClass('required')) {
        isValid = field.value.length > 0;
    }
    if($(field).hasClass('text')) {
        isValid = field.value.length > 1;
    }
	
    if($(field).hasClass('text') && $(field).hasClass('notrequired')) {
		isValid = false;
		if(field.value.length > 0){
		    isValid = field.value.length > 0;
		}else isValid = true;
    }
	
    if($(field).hasClass('url')) {
		isValid = isURL(field.value);
    }
	
    if($(field).hasClass('url') && $(field).hasClass('notrequired')) {
		isValid = false;
		if(field.value.length > 0){
		    isValid = isURL(field.value);
		}else isValid = true;
    }
	
    if($(field).hasClass('shorturl')){
        if(field.value.length > 3 && !(/\s/.test(field.value)) && !(/[а-я]|[А-Я]/.test(field.value))) isValid = true; else isValid = false;
    }
	
    if($(field).hasClass('shorturl') && $(field).hasClass('notrequired')){
		isValid = false;
		if(field.value.length > 0){
		    if(field.value.length > 0 && !(/\s/.test(field.value)) && !(/[а-я]|[А-Я]/.test(field.value))) isValid = true; else isValid = false;
		}else isValid = true;
    }
	
    if($(field).hasClass('name')) {
        if(field.value.length > 5 && !(/[0-9]/.test(field.value))  && !(/[~`@"#№$;%^:&?*()_+={}<>.,']/.test(field.value))){ isValid = /([а-я]|[a-z]|[-])/i.test(field.value); } else isValid = false;
    }
	
    if($(field).hasClass('shortname')) {
        if(field.value.length > 1 && !(/\s/.test(field.value)) && !(/[0-9]/.test(field.value))  && !(/[~`@"#№$;%^:&?*()_+={}<>,]/.test(field.value))){ isValid = /([а-я]|[a-z]|[-])/i.test(field.value); } else isValid = false;
    }
	
    if($(field).hasClass('integer')) {
        isValid = /^[^0]\d*$/.test(field.value);
    }
	
    if($(field).hasClass('email')) {
        field.value= field.value.replace('[at]','\@');
        isValid = isEmail(field.value);
    }
	
    if($(field).hasClass('email') && $(field).hasClass('notrequired')) {
		isValid = false;
		if(field.value.length > 0){
		    field.value= field.value.replace('[at]','\@');
	        isValid = isEmail(field.value);
		}else isValid = true;
    }
	
    if($(field).hasClass('url') && $(field).hasClass('notrequired')) {
		isValid = false;
		if(field.value.length > 0){
	        isValid = isURL(field.value);
		}else isValid = true;
    }

    if($(field).hasClass('phone')) {
        isValid = /^\+?\d{6,}$/.test(field.value.replace(/ |-|\(|\)/g, ''));
    }
    if($(field).hasClass('date')) {
        isValid = /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(field.value);
    }
    if($(field).hasClass('message')) {
        isValid = field.value.replace(/ /g, '').length >= 10;
    }
    if($(field).hasClass('select')) {
        isValid = field.selectedIndex > 0;
    }
    
         if(!isValid) {
             
            if(field.value.length < 2){
                  if($(field).parent().hasClass('valide')) $(field).parent().removeClass('valide');
                  if($(field).parent().hasClass('not-valide')) $(field).parent().removeClass('not-valide');
            }else{
                    $(field).parent().addClass('not-valide');
                    if($(field).parent().hasClass('valide')) $(field).parent().removeClass('valide');
                }
             
        }else{
            if($(field).parent().hasClass('not-valide')) $(field).parent().removeClass('not-valide');
            $(field).parent().addClass('valide');
        }
    
    return isValid;
}

function validateForm(formPath) {
    allOk = true;
    $(formPath + ' input[type=text]').each(function() {
         if($(this).hasClass('required') && !isValidField(this)) {
             allOk = false;
         }
    });
    
    allOk ? $(formPath + ' .startRegister').removeClass('button-disabled') : $(formPath + ' .startRegister').addClass('button-disabled');    
};

function cleanupForm(formPath) {
    $(formPath + ' .startRegister').addClass('button-disabled');
}

function validator(formPath) {
    
    cleanupForm(formPath);
	
    $(formPath + ' input[type=text]').bind('blur keyup focus change select', function() {
        validateForm(formPath);
    });
    
    $(formPath + ' .startRegister').click(function() {
        /*if(!$(formPath + ' .startRegister').hasClass('button-disabled')){
            		$('.register .form-here').load('../../register/send.php', {},  function() {
            			setTimeout("$('.register .form-here').text(''); $('form.RegisterForm').trigger('submit'); ",300);
            		});
        }*/
		
		$error = 0;
		dataArray = {};		
		$("input").each(function(i){
			$field = $(this)
			fname = $field.attr("id");
			fval = $field.val();
			dataArray[fname] = fval;
		});
		dataArray[$("#register-afterparty").attr("id")] = $("#register-afterparty:checked").val();
		dataArray['ajax'] = 'sendMessage';
		if(false === $("a.startRegister").hasClass("button-disabled")) {
			$.post(window.location.href, dataArray, function(data) {
				if(data.html != '') {
					$("#countPlace").text(data.countPlace);
					$("#result_send").html(data.html);
				}
				else {
					$("#error").html(data.error);
				}
			}, 'json');
		}

    });

    validateForm(formPath);
    
}
