    	$(document).ready(function(e) {
	$.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
	});
	
    $(window).on('load', function () {
		var $preloader = $('.peeek-loading');
		$preloader.fadeOut();
		$preloader.delay(350).fadeOut('slow');
	});
	var socket = io.connect(':8080');
	socket.on('online', function(data) {
        $('#online').text(data); 
    });
	socket.on('updateBalance', function(data) {
        if(USER_ID == data.id) $('#balance').html(data.balance);
    });
	$('.mobile-btn').click(function() {
		$('.mobile-menu').toggle();
	});
	$('.close, .popup-win .btn').click(function(e) {
        $('.popup, .overlay, body').removeClass('active');
		return false;
    });
	$('.overlay').click(function(e) {
        var target = e.target || e.srcElement;
		if(!target.className.search('overlay')) {
			$('.overlay, .popup, body').removeClass('active');
		} 
    });	
	$('[rel=popup]').click(function(e) {
    	showPopup($(this).attr('data-popup'));
		return false
    });
	$('.list-pay .item').click(function(e) {
        if(!$(this).is('.active')) {
			$(this).parent().find('.item').removeClass('active');
			$(this).addClass('active');
			checkSystem();
		}
    });
	$('#value').on('change keydown paste input', function() {
		calcSum();
	});
	
	function calcSum() {
        if($('.list-pay .active').data('type') == 'qiwi') {
            var perc = 4;
            var com = 1;
        } else if($('.list-pay .active').data('type') == 'yandex') {
            var perc = 0;
            var com = 0;
        } else if($('.list-pay .active').data('type') == 'webmoney') {
            var perc = 6;
            var com = 0;
        } else if($('.list-pay .active').data('type') == 'visa') {
            var perc = 4;
            var com = 50;
        }
        var val = $('#value').val();
        var comission = Math.round(val-(val/100*perc+com));
        if(!val) comission = 0;
        if(comission <= 1) comission = 0;
        $('#total').html(comission + ' руб.');
    }
	function checkSystem() {
		if($('.list-pay .active').data('type') == 'qiwi') {
            var perc = 4;
            var com = 1;
            var comission = 105;
            $('#wallet').attr('placeholder', '7900xxxxxxx');
        } else if($('.list-pay .active').data('type') == 'yandex') {
            var perc = 0;
            var com = 0;
            var val = 10;
            var comission = 10.6;
            $('#wallet').attr('placeholder', '41001хххххххххх');
        } else if($('.list-pay .active').data('type') == 'webmoney') {
            var perc = 6;
            var com = 0;
            var comission = 10.6;
            $('#wallet').attr('placeholder', 'R536xxxxxxxxx');
        } else if($('.list-pay .active').data('type') == 'visa') {
            var perc = 4;
            var com = 50;
            var comission = 1094;
			$('#wallet').attr('placeholder', '4700xxxxxxxxxxxx');
        }
		$('#min_wid').html(comission);
		$('#value').attr('placeholder', 'Мин. сумма: ' + comission + ' руб.');
		$('#com').html((com != 0) ? perc + '%' + ' + ' + com + 'руб.' : perc + '%');
    }
	socket.on('last', function(data) {
		var html = '';
			html += '<div class="drop">';
			html += '<div class="item">';
			html += '<div class="shadow" style="background: url( ' + data.item_rarity + ' );"></div>';
			html += '<img src="' + data.item_icon + '" alt="">';
			html += '</div>';
			html += '<div class="info">';
			html += '<div class="case">';
			html += '<div class="name">' + data.item_name + '</div>';
			html += '<a href="/case/' + data.case_link + '"><img src="' + data.case_img + '" alt=""></a>';
			html += '</div>';
			html += '<div class="user">';
			html += '<div class="avatar"><img src="' + data.avatar + '" alt=""></div>';
			html += '<div class="name">' + data.username + '</div>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		setTimeout(function() {
			$('#live').prepend(html);
		}, 8500);
		if($('.live-content .drop').length >= 20) $('.live-content .drop:nth-child(20)').remove();
    });
	$('.case-info .open-btn').on('click', function() {
		if($('.open-btn').attr('disabled') == 'disabled') return false;
		$.ajax({
			url : '/action/open',
			type : 'post',
			data : {
				case_id : CASE_ID
			},
			success : function(data) {
				if(!data.success) {
					$.wnoty({
						type: data.type,
						message: data.msg
					});
					return;
				}
				$('.roulette .overview').removeAttr('style');
				$('.win').html('');
				var html = '';
				var itemsTape = [];
				data.list.forEach(function (item) {
					var icon = item.icon;
					var rarity = item.rarity;
					for (var i = 0; i <= 100; i++) {
						itemsTape.push('<div class="item"><div class="shadow" style="background: url( '+rarity+' );"></div><img src="'+icon+'" alt=""></div>');
					}
				});
				itemsTape = shuffle(itemsTape);
				itemsTape.splice(110, itemsTape.length - 110);
				if (itemsTape.length < 110) {
					var differ = 110 - itemsTape.length;
					for (var i = 0; i < differ; i++) {
						itemsTape.push(itemsTape[0]);
					}
				}
				itemsTape[79] = '<div class="item 80"><div class="shadow" style= "background: url( '+data.drop.rarity+') ;"></div><img src="'+data.drop.icon+'" alt=""></div>';
				itemsTape.forEach(function (list) {
					html += list;
				});
				if(data.type == 'free') {
					var free = $('#free_open').text() - 1;
					$('#dec').html(declOfNum(free, ['раз','раза','раз']))
					$('#free_open').text(free);
				}
				$('.roulette .overview').html(html);
				$('.case-img').hide();
				$('.roulette').show();
				var text = $('.open-btn').html();
				$('.open-btn').attr("disabled", true);
				$('.open-btn').html('Открываем... <div class="ico-cart"></div>');
				setTimeout(function () {
					setTimeout(function () {
						audio('/assets/sound/victory.mp3', 0.3);
						var name = data.drop.name;
						var win = '';
							win += '<div class="first">ПОЗДРАВЛЯЕМ!</div>';
							win += '<div class="second">ВЫ ВЫИГРАЛИ <span>'+ data.drop.price +'</span> руб.</div>';
							win += '<div class="image"><img src="'+data.drop.icon+'" alt=""><span>'+ name.replace(/\(.*/, '') +'</span></div>';
							win += '<a class="btn yellow">Выиграть ещё</a>';
							win += '<a href="/" class="link-other-case">Другие кейсы</a>';
						$('.popup-win').html(win);
						$('.close, .popup-win .btn').click(function(e) {
							$('.popup, .overlay, body').removeClass('active');
							return false;
						});
						setTimeout(function () {
							$('.overview .item:nth-child(80)').addClass('active');
							clearInterval(interval);
							setTimeout(function () {
								showPopup('popup-win');
								$('.roulette').hide();
								$('.case-img').show();
								$('.open-btn').removeAttr('disabled');
								$('.open-btn').html(text);
							}, 1500);
						}, 100);
					}, 7000);
					$('.roulette .overview').css({
						transform: 'translate3d(-11997px, 0px, 0px)',
						transition: 7000 + 'ms cubic-bezier(1, 0, 0, 1)'
					});
					var start = 0,
						slot_width = $('.roulette .item').outerWidth(true),
						offset = 80 * slot_width,
						position = 0,
						interval = setInterval(function() {
							var offset = parseInt( $('.roulette .overview').css('transform').split(/[()]/)[1].split(', ')[4]-5 ) - start,
								position_actual = Math.floor(offset / slot_width);
							if(position_actual !== position) {
								audio('/assets/sound/metal.mp3', 0.2);
							}
							position = position_actual;
						}, 115);
				}, 200);
			},
			error : function(data) {
				$.wnoty({
					type: data.type,
					message: data.msg
				});
			}
		});
	});
	$('.promo .btn').on('click', function() {
		$.ajax({
			url : '/promo/activate',
			type : 'post',
			data : {
				code : $('.promo .input').val()
			},
			success : function(data) {
				$('.promo .input').val('');
				$.wnoty({
					type: data.type,
					message: data.msg
				});
			},
			error : function(data) {
				$.wnoty({
					type: data.type,
					message: data.msg
				});
			}
		});
	});
	$('#withdraw').click(function(){
		var system = $('.list-pay .active').attr('data-type');
		var value = $('#value').val();
		var wallet = $('#wallet').val();
		$.ajax({
            url : '/withdraw',
            type : 'post',
            data : {
                system : system,
                value : value,
				wallet : wallet
                
            },
			success : function(data) {
				$.wnoty({
                    type: data.type,
                    message: data.msg
                });
                $('.popup, .overlay, body').removeClass('active');
		        return false;
			},
            error : function(data) {
                console.log(data.responseText);
            }
        });
	});
});

function shuffle(o) {
	for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
}

function copyToClipboard(element) {
    var $temp = $('<input>');
    $('body').append($temp);
    $temp.val($(element).val()).select();
    document.execCommand('copy');
    $temp.remove();
    $.wnoty({
        position : 'top-right',
        type: 'success',
        message: 'Скопировано в буфер обмена!'
    });
}

function audio(audio, vol) {
    var media = new Audio();
	media.src = audio;
	media.volume = vol;
	var playPromise = media.play();
	setTimeout(function() {
		playPromise;
	}, 300);
	if(playPromise !== undefined) {
		playPromise.then(_ => {
			playPromise;
		})
		.catch(error => {
			media.play();
		});
	}
}

function showPopup(el) {
	if($('.popup').is('.active')) {
		$('.popup').removeClass('active');	
	}
	$('.overlay, body, .popup.'+el).addClass('active');
}

function declOfNum(number, titles) {  
    cases = [2, 0, 1, 1, 1, 2];  
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
}