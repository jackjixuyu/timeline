# 时间轴
适合长时间序列的jquery时间轴，支持自动播放、单击暂停、超长时间轴翻页等

**原版**：http://www.jq22.com/jquery-info19737 (作者：桐人Kirito)


使用示例：
```
var years = [1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002,
        2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018];

var timeplay = new Timeplay({
    datetimes: years,
    onClickChangeEnd: function () { //点击后回调
        console.log(timeplay.cur_time_index);
    },
    onAnimateEnd: function () { //时间轴动画每次结束回调
        console.log(timeplay.cur_time_index);
    }
});
```
