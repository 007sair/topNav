/**
 * 功能：顶部导航，页面跳转
 * 用法：
 * HTML调用：
 *   <nav class="m_nav">
 *    <div class="m_iscoll" id="navscroll">
 *      <ul>
 *        <li><a href="#1"><span>1</span></a></li>
 *        <li><a href="#2"><span>2</span></a></li>
 *        <li><a href="#3"><span>3</span></a></li>
 *      </ul>
 *      <a href="javascript:;" class="openbtn"></a>
 *    </div>
 *  </nav>
 * js调用：
 *   $('.m_nav').mnav();
 */

/**
 * Define requestAnimationFrame
 */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

/**
 * Naver
 */
;(function($, window, undefined) {

	var defaults = {
		className: 'anchor',
		id: 'navscroll',
		top: 0,
		iScrollJson: {
			fixedScrollBar: true,
			bindToWrapper: true,
			eventPassthrough: true,
			scrollX: true,
			scrollY: false,
			preventDefault: false
		}
	};

	function Naver($ele, opt){
		this.opt = $.extend({}, defaults, opt);
		this.$ele = $ele;	// $('.m_nav')
		this.$eleChild = this.$ele.find('#' + this.opt.id);
		this.openbtn = this.$ele.find('.openbtn');
		this.$li = this.$eleChild.find('li');
		this.$body = $('body');
		this.isFixed = 0;	//是否定位
		this.arr_anchorID = [];  //锚点元素的id，先遍历导航li的id，根据此id判断页面内的真实锚点
		this.activeLI = null;
		this.iCurTop = 0;   //滚动时当前scrollTop值

		this.init();
	}

	Naver.prototype = {
		constructor: Naver,
		init: function(){
			var _this = this;

			window.myScroll = new IScroll('#' + this.$eleChild.attr('id'), this.opt.iScrollJson);

			//如果导航li过多，显示更多按钮
			if (this.isWrap()) {
				this.openbtn.show();
			};

			//给锚点模块添加anchor
			this.$li.each(function(index, el) {
				var $li = $(this),
					hash = $li.find('a').attr('href');

				if (hash && hash.indexOf('#') > -1 && $(hash).length > 0) {
					$(hash).addClass(_this.opt.className);
					_this.arr_anchorID.push($(hash).attr('id'));	//创建真实锚点元素的id数组
				};
			});
			this.$anchor = $('.' + this.opt.className);

			//获取导航距顶部的top值
			this.offTop = this.$ele.offset().top;  
			//获取导航的高度
			this.iHeight = this.$ele.height();
			//更新导航li的data-anchors值
			this.setCustomData();

			//wap端header也是fixed
			if ($('header').length > 0) {
				this.opt.top += $('header').height();
			};

			this.bindEvent();

		},
		setCustomData: function() {  //设置有效导航锚点li的data-anchors数据
			var _this = this,
				anchorIndex = -1,
				curTop = _this.iCurTop + _this.iHeight;

			this.arr_anchorPos = [];
			this.$li.each(function(index, el) {
				var $li = $(this),
					hash = $li.find('a').attr('href'),
					id = hash ? hash.split('#')[1] : '';

				if (hash && hash.indexOf('#') > -1 && _this.isAnchor(hash)) { //是锚点链接 && 在当前页面内匹配到锚点id
					anchorIndex++; //为trueIndex 真实锚点位置
					var thisAnchor = $(hash),
						top = thisAnchor.offset().top,
						height = thisAnchor.height();

					$li.data('anchors', _this.arr2str([id, index, anchorIndex, top, height]));
					_this.arr_anchorPos.push(top);
				}
			});
		},
		getCustomData: function(str){  // 1|2|3 -> obj.id=1, obj.index=2, obj.trueIndex=3
			if (typeof str !== 'string') return false;
			//这个对象存放有效锚点的所有数据
			var anchorData = {
				id: null,			//锚点li的hash
				index: null,		//当前li在所有li的索引位置
				trueIndex: null,	//当前li在有效锚点li的索引位置
				top: null,			//每个锚点元素距顶部的绝对值
				height: null 		//每个锚点元素的高度
			};
			var arr = str.split('|'),
				i = -1;
			for(var key in anchorData){
				i++;
				anchorData[key] = +arr[i]; //+ string to number
			}
			return anchorData;
		},
		bindEvent: function(){
			var _this = this;

			if (gtIOS6()) {
				this.$ele.parent().addClass('sticky');
			};	

			//绑定滚动
			var stop = _this.debounce(function() {
				// console.log('debounce');
				_this.scrollStop();
				_this.setCustomData();
				_this.$body.removeClass('disable-event');
			}, 50);

			function fnScroll() {
				if (_this.isFixed !== 1) {
					// console.log('getTop')
					_this.offTop = _this.$ele.offset().top;
				};
				// console.log('scrolling')
				_this.$body.addClass('disable-event');
				_this.iCurTop = $(this).scrollTop();
				if (_this.iCurTop + _this.opt.top >= _this.offTop) {
					if (!gtIOS6()) {
						_this.fixed()
					}
				} else {
					_this.collapse();
					_this._static();
				}
				stop()
			}

			//第一次打开页面时页面的scrollTop不一定为0且不一定没有锚点 需初始化一下当前导航切换
			fnScroll();


			$(window).scroll(function(){
				// requestAnimationFrame(fnScroll);
				fnScroll()
			});


			//导航锚点点击事件
			this.$eleChild.on('click', 'li', function(index, el) {
				//点击触发前先更新所有按钮的数据
				_this.setCustomData();

				var $li = $(this),
					index = $li.index(),
					sData = $li.data('anchors'),
					top = _this.getCustomData(sData).top - _this.opt.top;

				_this.activeLI = $li;

				$li.addClass('active').siblings().removeClass('active');
				if (typeof top !== 'undefined' && top) {
					setTimeout(function() {
						if (_this.$ele.data('open') == 1) {
							//如果展开，点击后就收起
							_this.collapse();
						}
						_this.scrollYTo(0, top);
					}, 30);
				}
			});

			//点击更多
			this.openbtn.on('click', function() {
				document.title = _this.isFixed;
				if (_this.isFixed !== 1) {
					// var first = _this.arr_anchorPos[_this.findMin(_this.arr_anchorPos)];
					// $(window).scrollTop(first - _this.iHeight + 2 - _this.opt.top);
				}
				if (_this.$ele.data('open') == 1) {
					_this.collapse();
				}else{
					_this.expand();
				}
			});

			//滚动方向
			var upflag = 1;
			var downflag = 1;
			//scroll滑动,上滑和下滑只执行一次！
			this.scrollDirect(function(direction) {
				if (_this.isFixed !== 1) return false;
				if (direction == "down") {
					if (downflag) {
						// _this.$ele.hide()
						// console.log('down')
						downflag = 0;
						upflag = 1;
					}
				}
				if (direction == "up") { //到底部时会触发一次up
					if (upflag) {
						// _this.$ele.show()
						// console.log('up')
						downflag = 1;
						upflag = 0;
					}
				}
			});

		},
		scrollStop: function() {
			var _this = this,
				aIndex = -1,	//真实锚点位置,++后第一个为0
				curTop = _this.iCurTop + _this.iHeight + this.opt.top, //_this.iHeight+this.opt.top是为了校验wap的高度
				floor = _this.getIndex(curTop, _this.arr_anchorPos),	//滚动到的楼层
				curIndex = -1;	//滚动到的锚点元素（范围为所有li的index位置）

			this.$li.each(function(index, el) {
				var $li = $(this),
					hash = $li.find('a').attr('href'),
					data = $li.data('anchors'),
					top = _this.getCustomData(data).top,
					trueIndex = _this.getCustomData(data).trueIndex;

				var oReg = /module\/index\/\d+/g;
				if (floor == trueIndex || (floor === -1 && hash === '#') || window.location.href.indexOf(oReg.exec(hash)) > -1 ) {
					//满足 楼层相同 or 楼层为-1且hash值仅为# or 当前li的href链接与本页面链接相同 时 切换导航到当前位置
					curIndex = index
				};
			});
			_this.swipeTo(curIndex);
		},
		showPlace: function(){
			//设置ele的占位
			if (!this.$placeHolder) {
				this.$placeHolder = $('<div style="height:'+ this.iHeight +'px;">');
				this.$ele.after(this.$placeHolder);
			}else{
				this.$placeHolder.css('display','block');
			}
		},
		hidePlace: function(){
			this.$placeHolder && this.$placeHolder.css('display','none');
		},
		fixed: function(){
			if (this.isFixed !== 0) return false;
			this.$ele.addClass('fixed');
			this.$ele.data('fixed', 1);
			this.isFixed = 1;
			// console.log('fixed', this.isFixed);
		},
		_static: function(){
			if (this.isFixed == 0) return false;
			this.$ele.removeClass('fixed');
			this.$ele.data('fixed', 0);
			this.isFixed = 0;
			// console.log('_static', this.isFixed);
		},
		scrollYTo: function(x, y){
			if (typeof x === 'undefined' || typeof y === 'undefined') return false;
			var _this = this, 
				rafID = null,
				target = y - this.iHeight + 2,	//需要移动到的目标位置
				dis;

			function move() {
				rafID = requestAnimationFrame(move);
				var st = $(window).scrollTop();
				if (dis <= 0 || st == 0) {
					cancelAnimationFrame(rafID);
				} else {
					dis = (st - target) / 9;
				}
				window.scrollTo(x, st - dis);
			}
			move();
		},
		swipeTo: function(index){
			var _this = this,
				$li = this.$li.eq(index);

			if (_this.activeLI && _this.iCurTop + _this.iHeight < _this.getCustomData(_this.activeLI.data('anchors')).top) {
				//解决锚点元素高度不够高时选项卡切换问题
				$li = _this.activeLI;
				index = _this.getCustomData(_this.activeLI.data('anchors')).index;
			}
			$li.addClass('active').siblings().removeClass('active');
			window.myScroll.scrollToElement("li:nth-child(" + (index+1) + ")", 200, true);
			//滚动结束后要重置当前选中的li
			_this.activeLI = null;
		},
		isAnchor: function(hash){  //匹配传入的hash值能否在页面中找到对应的元素id
			if (this.$anchor.length < 0 || !hash) return false;
			for (var i = 0, len = this.arr_anchorID.length; i < len; i++) {
				if (hash === '#' + this.arr_anchorID[i]) {
					return true;
				}
			};
			return false;
		},
		getIndex: function(cur, arr){  //获取当前导航的curIndex状态，没有找到对应的楼层时返回-1
			var temp = 0,
				flag = -1;
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i] > temp && arr[i] < cur) {
					temp = arr[i];
					flag = i;
				}
			}
			return flag;
		},
		findMin: function(arr){
			var iMin = arr[0],
				index = 0;
			for (var i = 1, len = arr.length; i < len; i++) {
				if (arr[i] < iMin) {
					iMin = arr[i];
					index = i;
				}
			}
			return index;
		},
		debounce: function(func, wait, immediate) { //防抖函数
			var timeout;
			return function() {
				var context = this,
					args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		},
		arr2str: function(arr) {
			var str = '';
			for (var i = 0, len = arr.length; i < len; i++) {
				str += (i !== len - 1) ? arr[i] + '|' : arr[i];
			};
			return str;
		},
		isWrap: function(){  //选项卡个数是否超过一行
			var ww = this.$eleChild.find('ul').width(),
				iW = this.openbtn.width();
			if (ww - iW > $(window).width() || ww - iW > 640) {
				return true;
			}
			return false;
		},
		expand: function(){  //展开
			
			this.$eleChild.addClass('m_open');
			this.$eleChild.find('ul').addClass('mnavtransno');
			this.$ele.data('open', 1);
		},
		collapse: function(){  //收起
			this.$eleChild.removeClass('m_open');
			this.$eleChild.find('ul').removeClass('mnavtransno');
			this.$ele.data('open', 0);
		},
		scrollDirect: function(fn) {
			var beforeScrollTop = document.body.scrollTop;
			fn = fn || function() {};
			window.addEventListener("scroll", function(event) {
				event = event || window.event;

				var afterScrollTop = document.body.scrollTop;
				delta = afterScrollTop - beforeScrollTop;
				beforeScrollTop = afterScrollTop;

				var scrollTop = $(this).scrollTop();
				var scrollHeight = $(document).height();
				var windowHeight = $(this).height();
				if (scrollTop + windowHeight > scrollHeight - 10) { //滚动到底部执行事件
					fn('up');
					return;
				}
				if (afterScrollTop < 10 || afterScrollTop > $(document.body).height - 10) {
					fn('up');
				} else {
					if (Math.abs(delta) < 10) {
						return false;
					}
					fn(delta > 0 ? "down" : "up");
				}
			}, false);
		}
	};

	function gtIOS6() {
		var ua = window.navigator.userAgent,
			ios = !! ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
		return ios;
	}

	var sticky, fixed;
    var tmp = document.createElement("div"),
        prefix = ["-webkit-", "-ms-", "-o-", "-moz-", ""],
        has = function(val) {
            var actual = "";
            if (window.getComputedStyle) {
                actual = window.getComputedStyle(tmp).getPropertyValue("position");
            } else {
                actual = tmp.currentStyle.getAttribute("position");
            }
            return actual.indexOf(val) !== -1;
        };

    document.body.appendChild(tmp);

    for(var i = 0; i<prefix.length; i++) {
        tmp.style.cssText = "position:"+prefix[i]+"sticky;visibility:hidden;";
        if (sticky = has("sticky")) break;
    }
    console.log(sticky); // 

    tmp.style.cssText = "position:fixed;width:0;height:0;";
    console.log(fixed = has("fixed")); // IE6 也为 fixed, 但实际上没有效果

    setTimeout(function(){
    	$('#testID').text(sticky + '....' + (fixed = has("fixed")))
    },2000)

	$.fn.mnav = function(options) {
		return new Naver(this, options);
	};

})(Zepto, window);