jQuery( document ).ready(function() {
  var type = GetURLParameter('type');
  if(type === 'success'){
    toastr.success('Welcome to Revollet');
  }else if(type === 'error'){
    toastr.error('Sorry. User does not exist');
  };

});

function GetURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++){
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam)
    {
      return sParameterName[1];
    }
  }
}

jQuery(window).bind('scroll', function () {
  if ($(window).scrollTop() > 80) {
    $('#TopMenu').addClass('fixed-shadow', 1000);
  } else {
    $('#TopMenu').removeClass('fixed-shadow', 1000);
  }

  if ($(window).scrollTop() > 220) {
    $("#to-top").css("bottom", "20px");
  } else {
    $("#to-top").css("bottom", "-60px");
  }

  var scrollDistance = $(window).scrollTop();
  $('.page-section').each(function(i) {
    if ($(this).position().top-20 <= scrollDistance) {
      $('.navbar-nav li.active').removeClass('active');
      $('.navbar-nav li').eq(i).addClass('active');
    }
  });
});
function toTop () {
  $("html, body").animate({ scrollTop: 0 }, 2000)
}

$('a[href^=\"#"]').on('click', function(event) {
    var target = $(this.getAttribute('href'));
    if( target.length ) {
        event.preventDefault();
        $('html, body').stop().animate({
            scrollTop: target.offset().top - 10
        }, 1000);
    }
});

function showNewsModal(){
  $(".btn-detail").on("click", function(){
    let idNews = $(this).attr("data-news");  
    let currentNews = $(".card-news[data-news='" + idNews +"']");
    let idCardNews = currentNews[0]["id"];

    let srcImage = $("#"+idCardNews).find(".img-wrapper img").attr("src");
    let htmlTitle = $("#"+idCardNews).find(".card-title").html();
    let htmlDescription = $("#"+idCardNews).find(".news-description").html();
    
    $("#modal-news-detail").find(".img-wrapper img").attr("src", srcImage);
    $("#modal-news-detail").find(".modal-header .modal-title").html(htmlTitle);
    $("#modal-news-detail").find(".modal-body").html(htmlDescription);
  })
}

function stripsTags(text) {
  return $.trim($('<div>').html(text).text());
}

function get_news(key, news_id){
  $.ajax({
    url: "https://revollet.io/api/v2/news?per_page=3",
    type: "GET",
    headers: {
      'Authorization': key,
    },
    beforeSend: function(xhr){xhr.setRequestHeader('Authorization', key);},
    success: function(data) {
      if(data.news.length > 0) {

        var str_news = '';
        $.each(data.news, function(i, news) {
          str_news += '<div class=\"col-12 col-md-4\"><div class=\"card card-news\" id=\"card-news-'+news.id+'\" data-news=\"'+news.id+'\" ><div class=\"card-body\"><a data-toggle=\"modal\" data-target=\"#modal-news-detail\" data-news=\"'+news.id+'\" class=\"btn-detail d-block\"><div class=\"img-wrapper box-shadow text-center pb-3 img-wrapper\"><img class=\"EWallet__card__icon" src=\"https://revollet.io'+news.photo+'\" /></div></a><a data-toggle=\"modal\" data-target=\"#modal-news-detail\" data-news=\"'+news.id+'\" class=\"btn-detail\"><h5 class=\"card-title limit-1-line">'+news.title+'</h5></a><div class=\"card-text limit-2-line\">'+stripsTags(news.description)+'</div><a data-toggle=\"modal\" data-target=\"#modal-news-detail\" data-news=\"'+news.id+'\" class=\"btn-detail btn btn-viewmore float-right mt-3\">Details</a></div><div class=\"hidden news-description\" data-news=\"'+news.id+'\">'+news.body+'</div></div></div>';
        });
        $("#"+news_id).html(str_news)
      }
      showNewsModal();
    }
  });
}

function initSwiper() {
  const spaceBetween = 60;
  const depth = 50;

  const swiper = new Swiper('.swiper-container', {
    slidesPerView: 4,
    centeredSlides: true,
    spaceBetween: spaceBetween,
    loop: true,
    grabCursor: true,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
    },
    effect: "coverflow",
    coverflowEffect: {
      rotate: 0,
      depth: depth
    },
    breakpoints: {
      1800: {
        slidesPerView: 4,
        spaceBetween: spaceBetween * (14/16),
        coverflowEffect: {
          depth: depth * (14/16)
        }
      },
      1500: {
        slidesPerView: 4,
        spaceBetween: spaceBetween * (12/16),
        coverflowEffect: {
          depth: depth * (12/16)
        }
      },
      1300: {
        slidesPerView: 4,
        spaceBetween: spaceBetween * (10/16),
        coverflowEffect: {
          depth: depth * (10/16)
        }
      },
      1100: {
        slidesPerView: 4,
        spaceBetween: spaceBetween * (9/16),
        coverflowEffect: {
          depth: depth * (9/16)
        }
      },
      992: {
        slidesPerView: 4,
        spaceBetween: spaceBetween * (8/16),
        coverflowEffect: {
          depth: depth * (8/16)
        }
      },
      850: {
        slidesPerView: 4,
        spaceBetween: spaceBetween * (7/16),
        coverflowEffect: {
          depth: depth * (7/16)
        }
      },
      768: {
        slidesPerView: 2,
        spaceBetween: spaceBetween * (12/16),
        coverflowEffect: {
          depth: depth * (12/16)
        }
      }
    }
  });
}

$(document).ready(function() {
  var merchant_key = 'Revollet 3c36e27476d4a1d27f73b6c44f879453c2cefcba:ba9c21814daf3e27bd452a4aad366950f34a0d3033b3a9dde33cf1203e5541d7';
  get_news(merchant_key, 'news-items');
  initSwiper();
  setTimeout(function(){
    $(".icon-loading").remove();
    $(".currency__item canvas").addClass("show");
  }, 10000)
});