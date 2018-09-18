var Timeplay = function (options) {
    var timePlay = this;
    timePlay.default_option = {
        speed: 1000,
        datetimes: [],
        container: '#timeplay',
        pageControl: true,
        onClickChangeEnd: function (timePlay) {

        },
        onAnimateEnd: function (timePlay) {

        }
    };

    timePlay.options = jQuery.extend(true, timePlay.default_option, options);//基本配置

    timePlay.initDoms();//初始化结构

    timePlay.size = $('.timeProgress-inner li').outerWidth();    //每格长度

    timePlay.cur_time_index = 0;    //时间索引
    timePlay.hover_time_index = 0;  //临时索引

    timePlay.timer = null;          //动画定时器
    timePlay.offset = 0;            //时间轴总位移(时间轴被隐藏起来的长度)
    timePlay.cur_time_pixel = 0;    //当前时间对应的轴的长度
    timePlay.hover_time_pixel = 0;  //临时记录距离时间轴最左端的距离

    //timeProgress-box: 当前页面的时间轴
    //offset: timeProgress-box在浏览器页面中的位置
    timePlay.left = $(".timeProgress-box").offset().left;   //时间轴距离浏览器左边的距离(定长)
    timePlay.right = $(window).width() - timePlay.left - $(".timeProgress-box").width();    ////时间轴距离浏览器右侧的距离

    timePlay.init();//初始化
};

Timeplay.prototype.init = function () {
    var timePlay = this;
    timePlay.initDate();//初始化日期

    //播放暂停
    $('.timeControl').on('click', function () {
        timePlay.play();
    });

    //鼠标悬浮
    $('.timeProgress').on('mouseover', function () {
        timePlay.hoverPopup();
    });

    //鼠标单击
    $('.timeProgress').on('click', function () {
        timePlay.clickPopup();
    });

    //显示下一页的时间轴
    $(".next").on('click', function () {
        timePlay.pageNext();
    });

    //显示上一页的时间轴
    $(".prev").on('click', function () {
        timePlay.pagePrev();
    });
};


//鼠标悬浮显示提示信息
Timeplay.prototype.hoverPopup = function () {
    var timePlay = this;
    $(window).on('mousemove', function (event) {
        var e = event || window.event;
        var x = e.clientX;  //鼠标悬浮位置距离浏览器左侧的位置

        timePlay.hover_time_pixel = x + timePlay.offset - timePlay.left;  //距离时间轴最左侧的偏移量
        timePlay.hover_time_index = Math.floor(timePlay.hover_time_pixel / timePlay.size);    //时间索引：当前悬浮位置对应第几个时间标签

        $(".hover-popup").show().css("left", x - timePlay.left).text(timePlay.options.datetimes[timePlay.hover_time_index]);
    });

    $('.timeProgress').one('mouseleave', function () {
        $(window).off('mousemove');
        $(".hover-popup").hide();
    })
};

//鼠标单击事件(先触发悬浮后触发单击)
Timeplay.prototype.clickPopup = function () {
    var timePlay = this;
    timePlay.stopPlay();
    $(".curr-popup").hide().text(timePlay.options.datetimes[timePlay.hover_time_index]);
    $(".curr-popup.for-click").show().css('left', timePlay.hover_time_pixel - timePlay.offset);
    $(".timeProgress-bar").stop().css('width', timePlay.hover_time_pixel);
    timePlay.cur_time_pixel = timePlay.hover_time_pixel;
    timePlay.cur_time_index = timePlay.hover_time_index;
    timePlay.options.onClickChangeEnd();
};

//初始化日期
Timeplay.prototype.initDate = function () {
    var timePlay = this;

    $(".prev").addClass('disable');

    var time_width = $('.timeProgress-inner').width();  //时间进度条的总长度
    var page_width = $('.timeProgress-box').width();    //当前可见的时间进度条的长度(一页)
    if (Math.ceil(time_width / page_width) > 1) {
        $(".next").removeClass('disable');
    } else {
        $(".next").addClass('disable');
    }

    $(".curr-popup").show();

    $(".curr-popup").text(timePlay.options.datetimes[0]);

    timePlay.progressAni();
};

//初始化dom
Timeplay.prototype.initDoms = function () {
    var timePlay = this;
    $(timePlay.options.container).hide();
    var mainContainer = $('<div id="timeMain"></div>');
    var playControl = '<div class="timeControl-box"><div class="timeControl play"></div></div>';
    var pageControl = '<div class="prev-box"><div class="prev" title="上一页"></div></div><div class="next-box"><div class="next" title="下一页"></div></div><div class="change-speed slow">快</div>';
    var timeAxis = '<div class="timeProgress-box"><div class="hover-popup"></div><div class="curr-popup for-click"></div><div class="timeProgress-hide"><div class="timeProgress-inner"><div class="timeProgress"><div class="timeProgress-bar"><div class="curr-popup for-animate"></div></div></div><ul></ul></div></div></div>';

    $(timePlay.options.container).append(mainContainer);

    mainContainer.append(playControl).append(pageControl).append(timeAxis);

    var datelist = '';

    for (var idx in timePlay.options.datetimes) {
        datelist += '<li class="every"><span class="datetime-item">' + timePlay.options.datetimes[idx] + '</span></li>';
    }

    $(timePlay.options.container).show().find('ul').append(datelist);

    $(".change-speed").on("click", function () {
        if ($(this).hasClass("slow")) {
            timePlay.options.speed = 300;
            $(".change-speed.slow").removeClass("slow").addClass("fast").text("慢");
        } else {
            timePlay.options.speed = 1000;
            $(".change-speed.fast").removeClass("fast").addClass("slow").text("快");
        }
    });

};

//时间轴进度动画(调整时间轴位置)
Timeplay.prototype.progressAni = function () {
    var timePlay = this;
    var page_width = $('.timeProgress-box').width();                    //当前可见的时间进度条的长度(一页)
    var time_width = $('.timeProgress-inner').width();                  //时间进度条的总长度
    var left_dis = page_num * page_width;                               //隐藏时间轴的总长度
    var page_num = Math.floor(timePlay.cur_time_pixel / page_width);    //当前是第几页

    if (page_num == 0) {
        timePlay.offset = 0;
    } else {
        //如果当前页面的时间轴剩余长度不足一格，则用下一页的时间轴显示
        if (left_dis + page_width - timePlay.cur_time_pixel < timePlay.size) {
            left_dis = left_dis + (page_width / 2);
        }

        //尽量让剩余的时间轴充满屏幕
        if (left_dis + page_width > time_width) {
            left_dis = time_width - page_width;
            $(".next").addClass('disable');
        }

        //如果当前时间的位置距离浏览器最左侧不足一格的话，把时间轴往前拉一拉，争取让当前时间显示在屏幕中间
        if ((timePlay.cur_time_pixel - left_dis) < timePlay.size) {
            left_dis = left_dis - (page_width / 2);
        }
        timePlay.offset = left_dis;
    }

    $('.timeProgress-inner').css({'transform': "translateX(-" + timePlay.offset + "px)"});

    $(".timeProgress-bar").css({'width': timePlay.cur_time_pixel});

};

//是否到结尾
Timeplay.prototype.reachEnd = function () {
    var timePlay = this;
    var page_width = $('.timeProgress-box').width();

    var dis_right = page_width - (timePlay.cur_time_pixel - timePlay.offset);

    if (dis_right <= 108) {
        return true;
    } else {
        return false;
    }
};

Timeplay.prototype.play = function () {
    var timePlay = this;
    if ($('.timeControl').hasClass('play')) {
        timePlay.startPlay();
    } else {
        timePlay.stopPlay();
    }
};


Timeplay.prototype.startPlay = function () {
    var timePlay = this;
    $('.timeControl').toggleClass('play').toggleClass('pause');

    //相当于重新播放
    if (timePlay.cur_time_index == timePlay.options.datetimes.length) {
        timePlay.cur_time_index = 0;
        timePlay.cur_time_pixel = 0;
        $(".curr-popup").hide();
    }

    timePlay.progressAni();

    var display_func = function () {

        //如果到了当前时间的尾部，则翻页
        if (timePlay.reachEnd()) {
            timePlay.halfPageNext();
        }

        timePlay.cur_time_index++;

        timePlay.cur_time_pixel = Math.floor(timePlay.cur_time_pixel / timePlay.size) * timePlay.size + timePlay.size;

        if (timePlay.cur_time_index < $(".every").length) {
            $(".curr-popup").text(timePlay.options.datetimes[timePlay.cur_time_index]);
        }

        if (timePlay.cur_time_pixel >= $('.timeProgress').width()) {
            timePlay.cur_time_pixel = $('.timeProgress').width();
            $(".curr-popup").hide().text("END");
            $(".timeProgress-bar").css({'width': timePlay.cur_time_pixel});
            $(".curr-popup.for-click").show().css('left', timePlay.cur_time_pixel - timePlay.offset);
            timePlay.stopPlay();
        } else {
            $(".timeProgress-bar").css({'width': timePlay.cur_time_pixel});
            $(".curr-popup").hide();
            $(".curr-popup.for-animate").show();
            timePlay.options.onAnimateEnd();
            timePlay.timer = setTimeout(display_func, timePlay.options.speed);
        }

    };

    display_func();

};


Timeplay.prototype.stopPlay = function () {
    var timePlay = this;
    if ($('.timeControl').hasClass('pause')) {
        $('.timeControl').toggleClass('play').toggleClass('pause');
    }
    clearTimeout(timePlay.timer);
};

Timeplay.prototype.showPopup = function () {
    var timePlay = this;
    $(".curr-popup").hide();

    var t1 = timePlay.cur_time_index == 0 && timePlay.offset == 0;
    var t2 = timePlay.cur_time_index == timePlay.options.datetimes.length && $(".next").hasClass("disable");

    if (t1 || t2) {
        $(".curr-popup.for-click").show();
    } else {
        $(".curr-popup.for-animate").show();
    }
};

Timeplay.prototype.pageNext = function () {
    var timePlay = this;

    $(".prev").removeClass('disable');

    var page_width = $('.timeProgress-box').width();
    var time_width = $('.timeProgress-inner').width();

    timePlay.offset += page_width;

    if (timePlay.offset + page_width > time_width) {
        timePlay.offset = time_width - page_width;
        $(".next").addClass('disable');
    }

    timePlay.showPopup();

    $('.timeProgress-inner').css({'transform': "translateX(-" + timePlay.offset + "px)"});
};


Timeplay.prototype.pagePrev = function () {
    var timePlay = this;

    $(".next").removeClass('disable');

    var page_width = $('.timeProgress-box').width();
    timePlay.offset = timePlay.offset - page_width;

    if (timePlay.offset < 0) {
        timePlay.offset = 0;
        $(".prev").addClass('disable');
    }

    timePlay.showPopup();

    $('.timeProgress-inner').css({'transform': "translateX(-" + timePlay.offset + "px)"});
};


Timeplay.prototype.halfPageNext = function () {
    var timePlay = this;

    var page_width = $('.timeProgress-box').width();
    var time_width = $('.timeProgress-inner').width();

    timePlay.offset = timePlay.offset + page_width / 2;

    if (timePlay.offset + page_width > time_width) {
        timePlay.offset = time_width - page_width;
        $(".next").addClass('disable');
    }

    var page_num = Math.floor(timePlay.cur_time_pixel / page_width);
    if (page_num > 0) {
        $(".prev").removeClass('disable');
    }

    timePlay.showPopup();

    $('.timeProgress-inner').css({'transform': "translateX(-" + timePlay.offset + "px)"});
};
