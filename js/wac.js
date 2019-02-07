(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jQuery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
			module.exports = factory(require('jQuery'));
	} else {
				// Browser globals (root is window)
		root._wac = factory(root.jQuery);
	}
}(this, function($) {
	'use strict';

	// 웹접근성 관련 엔터 시 요소에 붙는 class
	var wacEnteredClass = 'web-accessibility-entered',
		eventContextStrLen = 100; // 이벤트 중복 검사 시 비교할 공백을 제외한 문자열길이.

	/**
	 * 인자 요소가 jQuery객체인지 조회.
	 *
	 * @param {object} el 조회할 요소.
	 * @returns jQuery객체 여부.
	 */
	var isjQueryObj = function(el) {
		return el instanceof jQuery;

	};

	/**
	 * jQuery obejct 부터 javascript object 반환.
	 *
	 * @param {object} el jQuery object
	 * @returns javascript object
	 */
	var getNativeObj = function(el) {
		return isjQueryObj(el)
			? el.get(0)
			: el

	};

	/**
	 * javascript object로 부터 jQuery Object 반환.
	 *
	 * @param {object} el jQuery 요소로 변환할 요소.
	 * @returns {object} jQuery 요소.
	 */
	var getjQueryObj = function(el) {
		return isjQueryObj(el)
			? el
			: $(el);

	};

	/**
	 * 비어있는 요소인지 여부 검사.
	 *
	 * @param {object} el 검사할 요소.
	 * @returns {boolean} 비어있는 요소인지 여부 조회.
	 */
	var isEmpty = function(el) {
		var $el = getjQueryObj(el);

		return !($el && $el.length);

	};

	/**
	 * focus 이동 가능한 요소들 반환.
	 *
	 * @param {object} el focus 이동 가능한 요소들을 조회할 요소.
	 * @returns focus 이동 가능한 요소들.
	 */
	var getFocusables = function(el) {
		var $el = getjQueryObj(el),
			focusables = $el.find('a, button, :input:not(:hidden), [tabindex], [href]');

		return focusables;
	};

	/**
	 * 보이는 focus 이동 가능한 요소들 반환.
	 *
	 * @param {object} el focus 이동 가능한 요소들을 조회할 요소.
	 * @returns focus 이동 가능한 요소들.
	 */
	var visibleFocusables = function(el){
		var $el = getjQueryObj(el),
		focusables = $el.find('a:visible, button:visible, :input:not(:hidden), [tabindex], [href]');

		return focusables;
	}

	/**
	 * 문자열에서 모든 공백제거.
	 *
	 * @param {String} str 공백제거 대상 문자열.
	 * @returns 공백이 제거된 문자열.
	 */
	var removeBlank = function(str) {
		var regEx = '/(\s*)/g, ""';

		return str.replace(regEx);
	};

	/**
	 * slider 요소에서 aria-live attr를 포함한 요소 조회.
	 *
	 * @param {object} target slider 또는 slider 하위 요소.
	 * @returns aria-live attr를 포함한 요소.
	 */
	var getAriaLiveEl = function(target) {

		var $target = getjQueryObj(target);

		return isEmpty($target.closest('[aria-live]')) // aria-live를 포함한 상위요소 존재여부 검사.
			? isEmpty($target.find('[aria-live]')) // aria-live를 포함한 상위요소가 없으면, 하위요소 존재여부 검사.
				? undefined // 상위, 하위 둘 다 없으면 undefined 반환.
				: $target.find('[aria-live]') // 하위요소 존재시 해당 요소 반환.
			: $target.closest('[aria-live]'); // 상위요소 존재시 해당 요소 반환.
	};

	/**
	 * slider 요소에서 aria-live attr를 포함한 요소 조회.
	 *
	 * @param {object} target slider 또는 slider 하위 요소.
	 * @returns aria-live attr를 포함한 요소를 반환하는 $.Deferred 객체.
	 */
	var getAriaLiveElAsync = function(target) {

		return $.utils.deferredAction(function() {
			return getAriaLiveEl(target)
		});
	};

	/**
	 * (bx, slick)slider 'aria-live' 설정.
	 * 포커스 이동시 aria-live 'polite'설정, 포커스 없을 시 aria-live 'off'설정.
	 *
	 * @param {object} slider slider 요소. (bxslider, slick 공통.).
	 */
	var setAriaLive = function(slider) {
		var $slider = getjQueryObj(slider), // slider의 jquery 객체.
			$ariaLiveEl = getAriaLiveEl($slider); // 'aria-live'특성을 포함한 jquery객체.

		// aria-live를 특성을 포함한 jquery객체로 부터 포커스 이동 가능한 요소들 탐색.
		var $focusableElements = !isEmpty($ariaLiveEl)
			? getFocusables($ariaLiveEl)
			: undefined;

		// 포커스 이동시 aria-live 'polite'설정.
		var focusHandler = function(e) {
			var $this = getjQueryObj(e.target),
				$ariaLiveEl = getAriaLiveEl($this); // 'aria-live' 특성을 포함한 jquery 객체.

			!isEmpty($ariaLiveEl)
				&& ($ariaLiveEl.attr('aria-live') === 'off')
				&& $ariaLiveEl.attr('aria-live', 'polite');
		};

		// 포커스 잃을 시 aria-live 'off'설정.
		var blurHandler = function(e) {
			var $this = getjQueryObj(e.target),
				$ariaLiveEl = getAriaLiveEl($this); // 'aria-live' 특성을 포함한 jquery 객체.

			!isEmpty($ariaLiveEl)
				&& ($ariaLiveEl.attr('aria-live') === 'polite')
				&& $ariaLiveEl.attr('aria-live', 'off');
		};

		// aria-live를 특성을 포함한 jquery객체로 부터 포커스 이동 가능한 요소가 있으면,
		!isEmpty($focusableElements)
			// aria-live를 특성을 포함한 jquery객체로 부터 포커스 이동 가능한 요소들에 focusHandler, blurHandler 연결.
			&& $focusableElements.each(function() {
				var $this = $(this);

				// 이벤트 중복 연결 방지 및 이벤트핸들러 연결.
				wireUpEventAsync($this, 'focus', focusHandler);
				wireUpEventAsync($this, 'blur', blurHandler);
			});
	};

	/**
	 * (bx, slick)slider 'aria-live' 설정.
	 * 포커스 이동시 aria-live 'polite'설정, 포커스 없을 시 aria-live 'off'설정.
	 *
	 * @param {object} slider slider 요소. (bxslider, slick 공통.)
	 * @returns slider의 'aria-live'를 설정하는 $.Deferred 객체.
 	*/
	var setAriaLiveAsync = function(slider) {
		return $.utils.deferredAction(function() {
			var $slider = getjQueryObj(slider),
				deferredArr = [];

			getAriaLiveElAsync($slider)
				.done(function($ariaLiveEl) {
					var $focusableElements = !isEmpty($ariaLiveEl)
						? getFocusables($ariaLiveEl)
						: undefined;

					var focusHandler = function(e) {
						var $this = getjQueryObj(e.target)

						getAriaLiveElAsync($this)
							.done(function($ariaLiveEl) {
								!isEmpty($ariaLiveEl)
									&& ($ariaLiveEl.attr('aria-live') === 'off')
									&& $ariaLiveEl.attr('aria-live', 'polite');
							});
					};

					var blurHandler = function(e) {
						var $this = getjQueryObj(e.target);

						getAriaLiveElAsync($this)
							.done(function($ariaLiveEl) {
								!isEmpty($ariaLiveEl)
									&& ($ariaLiveEl.attr('aria-live') === 'polite')
									&& $ariaLiveEl.attr('aria-live', 'off');
							});
					};

					!isEmpty($focusableElements)
						&& $.utils.deferredAction(function() {
							$focusableElements.each(function() {
								var $this = $(this);
								deferredArr.push(
									$.utils.deferredAction(function() {
										wireUpEventAsync($this, 'focus', focusHandler);
										wireUpEventAsync($this, 'blur', blurHandler);
									})
								);
							});
							!isEmpty(deferredArr)
								&& $.utils.deferredArrAction(deferredArr);
						});
				});
		});
	};

	/**
	 * 현재 이벤트가 상위로 전파되지 않도록 중단 + 현재 이벤트의 기본 동작 중단
	 * (ui.js에서 추출.)
	 *
	 * @param {object} e 이벤트객체.
	 */
	var preventDefaultAction = function(e) {
		e = e || window.event;
		if (e != undefined) {
			// 현재 이벤트가 상위로 전파되지 않도록 중단.
			if (e.stopPropagation) {
				// W3C standard variant
				e.stopPropagation();
			} else {
				// IE variant
				e.cancelBubble = true;
			};
			//
			if (e.preventDefault) { // W3C variant
				e.preventDefault();
			} else { // IE<9 variant:
				e.returnValue = false
			};
		};
	};

	/**
	 * wacEnteredClass를 갖고 있는지 검사.
	 * (wacEnteredClass를 하드코딩으로 사용하지 않기 위해 추가.)
	 *
	 * @param {object} el 검사대상 객체.
	 * @returns wacEnteredClass 포함 여부.
	 */
	var isWacEntered = function(el) {
		var $el = getjQueryObj(el);
		return $el.hasClass(wacEnteredClass);
	};

	/**
	 * el요소에 wacEnteredClass 추가 및 func실행.
	 *
	 * @param {object} el wacEnteredClass 추가할 요소.
	 * @param {function} func (선택) 요소 추가 후 실행할 함수.
	 * @returns el jQuery객체 또는 func의 결과값을 반환하는 $.Deferred 객체.
	 */
	var markWacEnteredAsync = function(el, func) {
		var $el = getjQueryObj(el);

		return $.utils.deferredAction(function() {
			!isWacEntered($el)
				&& $el.addClass(wacEnteredClass);

			return $.isFunction(func) ? func($el) : $el;
		});
	};

	/**
	 * el 요소에서 wacEnteredClass 제거 및 func 실행.
	 *
	 * @param {any} el wacEnteredClass 제거할 요소.
	 * @param {any} func (선택) 요소 제거 후 실행할 함수.
	 * @returns el jQuery객체 또는 func의 결과값을 반환하는 $.Deferred 객체.
	 */
	var removeWacEnteredAsync = function(el, func) {
		var $el = getjQueryObj(el);

		return $.utils.deferredAction(function() {
			isWacEntered($el)
				&& $el.removeClass(wacEnteredClass);

			return $.isFunction(func) ? func($el) : $el;
		});
	};


	/**
	 * key event가 tab key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns tab key event 인지 여부.
	 */
	var isTabEvent = function(e) {
		return (
			!isShiftTabEvent(e) // shift-tab event 제외.
			&& (e.keyCode || e.which) === 9 // tab event 여부.
		);
	};

	/**
	 * key event가 enter key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns enter key event 인지 여부 검사.
	 */
	var isEnterEvent = function(e) {
		return (e.keyCode || e.which) === 13; // enterkey event 여부.
	};

	/**
	 * key event가 esc key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns esc key event 인지 여부 검사.
	 */
	var isEscEvent = function(e) {
		return (e.keyCode || e.which) === 27; // esckey event 여부.
	};

	/**
	 * key event가 right-arrow key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns right-arrow key event 인지 여부 검사.
	 */
	var isRightArrowEvent = function(e) {
		return (e.keyCode || e.which) === 39; // right-arrow event 여부.
	};

	/**
	 * key event가 up-arrow key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns up-arrow key event 인지 여부 검사.
	 */
	var isUpArrowEvent = function(e) {
		return (e.keyCode || e.which) === 38; // up-arrow event 여부.
	};


	/**
	 * key event가 left-arrow key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns left-arrow key event 인지 여부 검사.
	 */
	var isLeftArrowEvent = function(e) {
		return (e.keyCode || e.which) === 37; // left-arrow event 여부.
	};


	/**
	 * key event가 down-arrow key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns down-arrow key event 인지 여부 검사.
	 */
	var isDownArrowEvent = function(e) {
		return (e.keyCode || e.which) === 40; // down-arrow event 여부.
	};


	/**
	 * key event가 shift+tab key event 인지 여부 검사.
	 *
	 * @param {object} e key event 객체.
	 * @returns shift+tab key event 인지 여부
	 */
	var isShiftTabEvent = function(e) {
		return (((e.keyCode || e.which) === 9) && e.shiftKey); // tab + shift event 여부.
	};

	/**
	 * nextEl 인자가 비어있지 않으면, nextEl 요소로 focus 이동,
	 * 비어있으면 default 액션 실행. (nextEl요소를 인자로 넘기기 전에 유효성검사 불필요.)
	 *
	 * @param {object} e 이벤트 객체.
	 * @param {object} nextEl focus 이동할 객체.
	 * @param {function} callback (선택인자)focus이동 후 실행함수.
	 * @returns nextEl의 jQuery객체 또는 callback의 반환값을 반환하는 $.Deferred 객체.
	 */
	var onNextAsync = function(e, nextEl, callback) {
		var $nextEl = getjQueryObj(nextEl);

		return $.utils.deferredAction(function() {
			!isEmpty($nextEl) // $next가 존재시,
				&& (function() {
					preventDefaultAction(e); // 기본액션중지.
					$nextEl.focus(); // 포커스 이동.
				})();

			return $nextEl;
		}).then(function(returnVal) {
			return $.isFunction(callback) // callback이 함수인지 검사.
				? callback(returnVal) // callback 존재시 호출.
				: returnVal; // callback이 없으면, nextEl 반환.
		});
	};

	/**
	 * 검사대상 요소(el)의 이벤트 타입명(nameOfEvents) 이벤트에 이벤트핸들러 인자(evtHandler)가 연결되어있는지 여부 검사.
	 * (이벤트 중복 연결 방지용으로 검사 함수.)
	 *
	 * @param {object} el 검사대상 요소.
	 * @param {string} nameOfEvents 이벤트 타입명.
	 * @param {function} evtHandler 이벤트핸들러.
	 * @returns {boolean} 검사대상 요소(el)의 이벤트 타입명(nameOfEvents) 이벤트에 이벤트핸들러 인자(evtHandler)가 연결되어있는지 여부.
	 */
	var isEventBound = function(el, nameOfEvents, evtHandler) {
		var nameOfEventArr = nameOfEvents.split(/, | |,/), // 이벤트명들 인자를 공백, 공백+콤마, 콤마로 구분.
			eventArr = [], // handlerObj 배열.(getEventhandlerArr 참고.)
			isExist = false;

		!isEmpty(el) // 유효성 검사.
			&& !isEmpty(nameOfEventArr) // 유효성 검사.
			&& $.isFunction(evtHandler) // 유효성 검사.
			&& (function() {
				nameOfEventArr.forEach(function(v, i, a) {
					$.extend(eventArr, getEventhandlerArr(el, v)); // handlerObj 배열을 구해서, eventArr에 저장.
				});

				// eventArr에 evtHandler가 포함 되어있는지 여부 조회.
				// eventArr에 evtHandler가 포함 되어있으면, evtHandler가 이미 바인딩 된걸로,
				// 그렇치 않으면 evtHandler가 바인딩 되지 않은 것으로 간주.
				isExist = eventArr.some(function(v, i, a) {
					(v.name && evtHandler.name)
						? v.name === evtHandler.name // es6 지원브라우져, eventHandler 이름이 있는 경우.
						: v.context === removeBlank(evtHandler.toString()).substring(0, eventContextStrLen); // es6 미지원브라우져, eventHandler의 이름이 없는 경우.
				});
			})();

		return isExist;
	};

	/**
 	 * 검사대상 요소(el)의 이벤트 타입명(nameOfEvents) 이벤트에 이벤트핸들러 인자(evtHandler)가 연결되어있는지 여부 검사.
	 * 이벤트 중복 연결 방지용으로 검사 함수.
	 *
	 * @param {any} el 검사대상 요소.
	 * @param {any} nameOfEvents 이벤트 타입명.
	 * @param {any} evtHandler 이벤트핸들러.
	 * @returns 검사대상 요소(el)의 이벤트 타입명(nameOfEvents) 이벤트에 이벤트핸들러 인자(evtHandler)가 연결되어있는지 여부를 반환하는 $.Deferred 객체.
	 */
	var isEventBoundAsync = function(el, nameOfEvents, evtHandler) {
		var nameOfEventArr = nameOfEvents.split(/, | |,/);

		return (!isEmpty(el) && !isEmpty(nameOfEventArr) && $.isFunction(evtHandler))
			? $.utils.deferredAction(function() {
				var eventArr = [],
					deferredArr = [],
					isBound = false;

				nameOfEventArr.forEach(function(v, i, a) {
					deferredArr.push(getEventhandlerArrAsync(el, v));
				});

				$.utils.deferredArrAction(deferredArr)
					.done(function(arrOfeventHandlerArr) {
						arrOfeventHandlerArr.forEach(function(v, i, a) {
							$.extend(eventArr, v);
						});
						isBound = eventArr.some(function(v, i, a) {
							return (v.name && evtHandler.name)
								? v.name === evtHandler.name // es6 지원브라우져, eventHandler 이름이 있는 경우.
								: v.context === removeBlank(evtHandler.toString()).substring(0, eventContextStrLen); // es6 미지원브라우져, eventHandler의 이름이 없는 경우.
						});
					});
				return isBound;
			})
			: $.utils.deferredAction(function() {
				return isBound;
			});
	};

	/**
	 * eventHandler의 중복 바인딩 방지 검사 후 이벤트 바인딩.
	 *
	 * @param {object} el 이벤트를 연결할 대상.
	 * @param {string} nameOfEvents 이벤트명들(콤마 또는 공백으로 구분).
	 * @param {function} handler 이벤트 핸들러.
	 * @returns el인자의 jQuery객체를 반환하는 $.Deferred 객체.
	 */
	var wireUpEventAsync = function(el, nameOfEvents, handler, selector) {
		var $el = getjQueryObj(el);

		return (!isEmpty($el) && $.isFunction(handler)) // 인자 유효성 검사.
			? isEventBoundAsync($el, nameOfEvents, handler) // 이미 바인딩 된 이벤트핸들러인지 여부 검사.
				.then(function(isBound) {
					!isBound // handler인자가 바인딩 되지 않았으면,
						&& nameOfEvents.split(/, | |,/)
							.forEach(function(v, i, a) { // 이벤트명들에 핸들러 바인딩.
								selector
									? $el.on(v, selector, handler)
									: $el.on(v, handler);
							});
					return el;
				})
			: $.utils.deferredAction(function() {
				return el;
			});
	};

	/**
	 * to 요소의 focus, blur 이벤트에 hover, mouseout 이벤트 연결.
	 *
	 * @param {object} to from의 hover이벤트를 focus이벤트에 연결할 대상 요소.
	 * @param {object} from (선택) hover이벤트를 가져올 대상 요소.
	 * (from이 빈값이면 to인자의 hover이벤트가 to인자의 focus이벤트에 연결된다.)
	 */
	var wireUpHoverToFocus = function(to, from) {
		(!isEmpty(to))
			&& (function(to, from) {
				var $to = getjQueryObj(to),
					// from 인자가 없으면, to인자로 대체.
					$from = isEmpty(from) ? $to : getjQueryObj(from);

				$to
					.off("focus.wireUpHoverToFocus focusin.wireUpHoverToFocus");
				$to.on(
					// focus, focusin에 mouseenter, hover, mouseover 이벤트핸들러 연결.
					"focus.wireUpHoverToFocus focusin.wireUpHoverToFocus",
					function(e) {
						$from.trigger("mouseenter");
						$from.trigger("hover");
						$from.trigger("mouseover");
						preventDefaultAction(e);
					}
				);

				$to
					.off("focusout.wireUpHoverToFocus blur.wireUpHoverToFocus"); // from 인자가 없으면, to인자로 대체.
				$to.on(
					// focusout, blur 이벤트에 mouseout, mouseleave 이벤트핸들러 연결.
					"focusout.wireUpHoverToFocus blur.wireUpHoverToFocus",
					function(e) {
						$from.trigger("mouseout");
						$from.trigger("mouseleave");
						preventDefaultAction(e);
					}
				);
			})(to, from);
	};
	/**
	 * to 요소의 focus, blur 이벤트에 hover, mouseout 이벤트 연결.
	 *
	 * @param {object} to from의 hover이벤트를 focus이벤트에 연결할 대상 요소.
	 * @param {object} from (선택) hover이벤트를 가져올 대상 요소.
	 * (from이 빈값이면 to인자의 hover이벤트가 to인자의 focus이벤트에 연결된다.)
	* @returns to 요소의 focus, blur 이벤트에 hover, mouseout 이벤트 연결하는 $.Deferred 객체.
	 */
	var wireUpHoverToFocusAsync = function(to, from) {
		return $.utils.deferredAction(function() {
			wireUpHoverToFocus(to, from);
		});
	};

	/**
	 * 포커스가능 요소 관련 정보.
	 * (포커스 이동시 중복적으로 구해야하는 값들이라서 추가..)
	 *
	 * @param {object} focusables (focusable요소를 포함한) 포커스가능 요소들.
	 * @param {object} focusable 포커스 가능 요소.
	 * @returns focusables에서 focusable 정보.
	 */
	var getFocusableInfo = function(focusables, focusable) {
		var info = (!isEmpty(focusables) && !isEmpty(focusable))
			&& (function() {
				var $focusables = getjQueryObj(focusables),
					$focusable = getjQueryObj(focusable),
					idx = $focusables.index($focusable), // 색인.
					totalLen = $focusables.length, // focusables 총길이.
					isFirst = idx === 0, // focusable이 첫번째 요소인지 여부
					isLast = (totalLen - 1) === idx, // focusable이 마지막 요소인지 여부.
					id = $focusable.attr('id'); // focusable에서 id특성 조회.

				return {
					idx: idx,
					totalLen: totalLen,
					isFirst: isFirst,
					isLast: isLast,
					id: id,
				};
			})();

		return info ? info : {};
	};

	/**
	* 포커스가능 요소 관련 정보.
	* (포커스 이동시 중복적으로 구해야하는 값들이라서 추가..)
	*
	* @param {object} focusables (focusable요소를 포함한) 포커스가능 요소들.
	* @param {object} focusable 포커스 가능 요소.
	* @returns focusables에서 focusable 정보를 반환하는 $.Deferred 객체.
	*/
	var getFocusableInfoAsync = function(focusables, focusable) {
		return $.utils.deferredAction(function() {
			var focusableInfo = getFocusableInfo(focusables, focusable);
			return focusableInfo;
		});
	};

	/**
	 * target에 nameOfEvent명의 이벤트 조회.
	 *
	 * @param {object} target 이벤트가 걸려있는 객체.
	 * @param {string} nameOfEvent 조회할 이벤트명.
	 * @returns { index, name, context, handler, selector } 객체 배열.
	 */
	var getEventhandlerArr = function(target, nameOfEvent) {
		var $target = getjQueryObj(target);

		return !isEmpty($target)
			&& (function($target, nameOfEvent) {
				var eventObj = $._data($target.get(0), 'events'), // target 객체의 event들 조회.
					// 이벤트 핸들러 정보 저장을 위한 객체.
					handlerObj = function(index, name, context, handler, selector) {
						this.index = index;
						this.name = name;
						this.context = context;
						this.handler = handler;
						this.selector = selector;
					},
					results = []; // handlerObj 배열.

				!isEmpty(eventObj) // 이벤트가 존재시,
					&& !isEmpty(eventObj[nameOfEvent]) // 조회하려는 이벤트에 핸들러가 존재시,
					&& eventObj[nameOfEvent] // 핸들러 배열
						.forEach(function(v, i, a) {
							results.push( // handlerObj 배열에 저장.
								new handlerObj(
									i,
									v.handler.name,
									!v.handler.name // 핸들러 이름이 없으면,
									// 공백을 제거한 핸들러내용을 eventContextStrLen길이 만큼 저장.
									&& removeBlank(v.handler.toString()).substring(0, eventContextStrLen),
									v.handler, // 핸들러저장.
									v.selector // 셀렉터 저장.
								)
							)
						});

				return results;
			})($target, nameOfEvent);
	};

	/**
	 * target에 nameOfEvent명의 이벤트 조회.
	 *
	 * @param {object} target 이벤트가 걸려있는 객체.
	 * @param {string} nameOfEvent 조회할 이벤트명.
	 * @returns { index, name, context, handler, selector } 객체 배열을 반환하는 $.Deferred 객체.
	 */
	var getEventhandlerArrAsync = function(target, nameOfEvent) {
		return $.utils.deferredAction(function() {
			return getEventhandlerArr(target, nameOfEvent);
		});
	};

	/**
	 * el인자의 다음(next) 또는 이전(prev) 요소의 첫번째 또는 마지막 포커스 가능한 요소 반환.
	 * (setAccessibility 호출 시 다음, 이전 포커스 가능한 인자를 조회 하는 용도로 작성)
	 *
	 * @param {object} $el 다음 또는 이전 요소 검색을 위한 기준 요소.
	 * @param {string} direction ('next', 'prev') 조회 방향.
	 * @returns 포커스 이동 가능한 요소.
	 */
	var getNextFocusable = function(el, direction) {
		var $el = getjQueryObj(el),
			$nextEl = undefined, // 반환값.
			$tmp = undefined, // loop를 위한 임시값.
			$focusables = undefined; // 임시값으로 부터 포커스가능한 요소 조회.

		while (isEmpty($nextEl)) { // $nextEl요소가 비어있으면,
			$tmp = (direction === 'next') // 다음요소 조회.
				? $el.next()
				: (direction === 'prev') // 이전 요소 조회.
					? $el.prev()
					: undefined;

			if (isEmpty($tmp)) { // 조회결과가 없으면 루프 끝냄.
				break;
			}

			$focusables = getFocusables($tmp); // 포커스 가능요소 조회.

			isEmpty($focusables) // 포커스 가능요소가 없으면,
				? $el = $tmp // 재탐색을 위해 대입.
				: $nextEl = (direction === 'next') // 포커스가능요소가 있고, 'next'면
					? $focusables.first() // 포커스 가능요소 중 첫번재 $next요소에 요소 대입.
					// 포커스가능요소가 있고, 'next'가 아니면('prev'면) $next요소에 포커스 가능 요소 중 마지막 요소 대입.
					: $focusables.last();
		}

		return $nextEl;
	};

	/**
	 * el인자의 다음(next) 또는 이전(prev) 요소의 첫번째 또는 마지막 포커스 가능한 요소 반환.
	 * (setAccessibility 호출 시 다음, 이전 포커스 가능한 인자를 조회 하는 용도로 작성)
	 *
	 * @param {object} $el 다음 또는 이전 요소 검색을 위한 기준 요소.
	 * @param {string} direction ('next', 'prev') 조회 방향.
	 * @returns 포커스 이동 가능한 요소를 반환하는 $.Deferred 객체.
	 */
	var getNextFocusableAsync = function(el, direction) {
		return $.utils.deferredAction(function() {
			return getNextFocusable(el, direction);
		});
	};

	/**
	 * gnb 마지막 메뉴 다음 포커스 이동 요소의 shift-tab event 연결 함수
	 * (gnb를 포함한 페이지에서 전역으로 사용되서 여기에 추가.)
	 *
	 * @param {object | function} getNextElOfGnbLast gnb마지막 메뉴 다음 포커스 이동 요소 또는  반환하는 함수.
	 */
	var wireUpShiftTabEventOnNextElOfGnbLast = function(nextElOfGnbLast) {
		var isFunction = $.isFunction(nextElOfGnbLast), // getter함수 인지 검사.
			$nextElOfGnbLast = isFunction
				? getjQueryObj(nextElOfGnbLast()) // 함수면 호출 후 jQuery객체로 입력.
				: getjQueryObj(nextElOfGnbLast); // 함수가 아니면 jQuery객체로 입력.

		// shift-tab key event handler
		var shiftTabHandler = function(e) {
			isShiftTabEvent(e)
				&& $.utils.deferredAction(function() {
					// gnb 마지막 메뉴의 마지막 포커스 이동 가능 요소 조회.
					var $next = getFocusables($('#gnbScrollFixed .push-nav .wrap-toggle')).last();

					// gnb 마지막 메뉴의 마지막 포커스 이동 가능 요소의 상위 'wrap-toggle'요소 활성화(activate).
					$next
						.closest('.wrap-toggle')
						.addClass('active');

					return $next;
				}).done(function(returnVal) {
					// gnb 마지막 메뉴의 마지막 포커스 이동 가능 요소의 상위 'wrap-toggle'요소 활성화(activate) 후 이동.
					onNextAsync(e, returnVal);
				});
		};

		!isEmpty($nextElOfGnbLast) // gnb 마지막 포커스 이동 요소와 포커스 연결된 요소가 존재시,
			&& wireUpEventAsync($nextElOfGnbLast, 'keydown', shiftTabHandler); // shift-tab key event 연결.
	};

	/**
	 * bx-slider 웹접근성 관련.
	 */
	var bx = function() {
		var contTabHandlerArr = []; // slider의 direction이 존재하는 경우 사용.
		/**
		 * bxSlider에서 'bx-controls .bx-pager' 하위 요소중 focus 이동 가능한 요소 반환.
		 *
		 * @param {object} slider bx-slider 객체.
		 * @returns '.bx-controls' 하위의 포커스 이동 가능한 pager 요소들.
		 */
		var getFocusablePagerEls = function(slider) {
			var $slider = getjQueryObj(slider);

			return getFocusables( // 'bx-pager'요소 하위의 포커스 이동 가능한 요소들 조회.
				$slider
					.closest('.bx-wrapper') // 슬라이더요소의 상위 'bx-wrapper' 요소 조회.
					.find('.bx-controls .bx-pager') // 'bx-wrapper'요소 하위의 'bx-pager'요소 조회.
			);
		};

		/**
		 * bxSlider에서 Cont Li 요소들 반환.
		 *
		 * @param {object} slider bx-slider 객체.
		 * @returns bx-slider 하위의 cont 하위의 li 요소들.
		 */
		var getContLis = function(slider) {
			var $slider = getjQueryObj(slider),
				$viewport = $slider
					.closest('.bx-wrapper')
					.find('.bx-viewport'),
				// 2018/04/30 현재 시점에 ul하위의 li, area, div요소들은 aria-hidden 특성을 포함하고 있다.
				$lis = $viewport.find('[aria-hidden]');

			// aria-hidden 특성으로 조회 실패 시 li, article 요소 조회.
			isEmpty($lis)
				&& ($lis = $viewport.find('li'));
			isEmpty($lis)
				&& ($lis = $viewport.find('article'));

			return $lis;
		};

		/**
		 * bx-slider의 기본pager에서 enter 입력 시,
		 * 해당 pager와 일치하는 cont로 focus 이동 하는 enter key event handler 반환.
		 * (중복 바인딩 방지를 위해 내부의 hanlder에 이름 할당.)
		 * 해당 pager와 일치하는 cont로 focus 이동 하는 enter key event handler
		 *
		 * @param {object} focusablePagerEl 포커스 이동 가능한 기본 pager 요소.
		 * @param {object} slider bx-slider 요소.
		 * @returns {function} bx-slider의 기본pager에서 enter 입력 시,
		 */
		var getPagerEnterHandler = function(focusablePagerEl, slider) {
			var pagerEnterHandler = function(e) {
				var $this = $(this); //entered pager

				isEnterEvent(e)
					// wacEnteredClass 추가 및 요소와 일치하는 슬라이드로 이동.
					&& markWacEnteredAsync($this, function() {
						slider.goToSlide(parseInt($this.data('slideIndex')));
					});
			};

			return pagerEnterHandler;
		};

		/**
		 * bx-slider pager요소들의 focusout 이벤트 핸들러 반환.
		 *
		 * @returns bx-slider pager요소들의 focusout 이벤트 핸들러.
		 */
		var getPagerFocusoutHandler = function() {
			var focusoutHandler = function(e) {
				var $this = $(this);

				// 포커스를 잃을 시, wacEnteredClass 제거
				// setTimeout이 없으면,
				// wacEnteredClass제거 보다 포커스 이동이 먼저 잃어나서 wacEnteredClass 제거가 안되는 경우가 있다.
				setTimeout(function() {
					removeWacEnteredAsync($this);
				}, 100);
			};

			return focusoutHandler;
		};

		/**
		 * bx-slider pager의 첫번째 요소의 shift-tab key event handler 반환.
		 *
		 * @param {object} focusablePagerEl pager요소.
		 * @param {object | function} prevEl 첫번째 pager요소에서 shift-tab 시 focus 이동할 대상요소 또는 구하는 함수.
		 * @param {function} prevElTabHandler 이전 focus 요소의 tab키 이벤트 핸들러.
		 * @returns pager요소의 첫번째 요소의 shift-tab key event handler
		 */
		var getFirstPagerShiftTabHandler = function(focusablePagerEl, prevEl, isFirstPager, prevElTabHandler) {
			var $focusablePagerEl = getjQueryObj(focusablePagerEl), // 포커스 이동 가능한 bx-pager요소들.
				isByFunc = $.isFunction(prevEl); // 이전요소를 함수로 구하는지(true), 요소가 인자(false)로 들어오는지 여부.

			var firstPagerShiftTabHandler = function(e) {
				var $this = $(this);

				isShiftTabEvent(e)
					&& isFirstPager
					&& $.utils.deferredAction(function() {
						var $p = isByFunc ? getjQueryObj(prevEl()) : getjQueryObj(prevEl); // prevEl 대입.

						// 포커스 이동과 prevElTabHandler 연결과 연관관계가 없어서, thenable요소 없이 호출.
						onNextAsync(e, $p);
						// runtime에 prevEl 요소를 구할 수 밖에 없는 경우가 있어서...
						!isEmpty(prevElTabHandler)
							&& $.isFunction(prevElTabHandler)
							&& !isEmpty($p)
							&& wireUpEventAsync($p, 'keydown', prevElTabHandler); // prevElTabHandler 연결.
					});
			};

			return firstPagerShiftTabHandler;
		};

		/**
		 * bx-slider pager요소의 tab이벤트 핸들러 반환.
		 *
		 * @param {object} slider bx-slider
		 * @returns bx-slider pager요소의 tab이벤트 핸들러.
		 */
		var getPagerTabHandler = function(slider) {
			var pagerTabEventHandler = function(e) {
				var $this = $(this);

				isTabEvent(e) // tab이벤트 인지 검사.
					&& isWacEntered($this) // wacEnteredClass 존재 여부검사.
					// 현재 슬라이드의 첫번째 포커스 이동 가능한 요소로 이동.
					&& onNextAsync(e, getFocusables(slider.getCurrentSlideElement()).first());
			};

			return pagerTabEventHandler;
		};

		/**
		 * bx-slider pager의 마지막 요소의 tab key event handler 반환.
		 *
		 * @param {object} bx-slider
		 * @param {object} focusablePagerEl pager요소.
		 * @param {object|function} nextEl 마지막 pager요소에서 tab 시 focus 이동할 대상요소 또는 구하는 함수.
		 * @param {boolean} isLastPager focusablePagerEl요소가 pager의 마지막요소인지 여부.
		 * @param {function} nextElShiftTabHandler pager 마지막 요소의 다음 tab 이동 요소의 shift-tab 이벤트핸들러.
		 * @returns pager의 마지막 요소의 tab이벤트 핸들러.
		 */
		var getLastPagerTabHanlder = function(slider, focusablePagerEl, nextEl, isLastPager, nextElShiftTabHandler) {
			var $focusablePagerEl = getjQueryObj(focusablePagerEl), // bx-pager 하위의 포커스 이동 가능한 요소들.
				isByFunc = $.isFunction(nextEl); // nextEl이 함수인지 여부.
			var lastPagerTabHandler = function(e) {
				var $this = $(this),
					$nextFocusable = isByFunc ? getjQueryObj(nextEl()) : getjQueryObj(nextEl);

				isTabEvent(e)
					&& isLastPager
					&& $.utils.deferredAction(function() {
						isWacEntered($this)
							// wacEnteredClass가 있으면, 현재 슬라이드의 첫번째 포커스 가능한 요소로 이동.
							? onNextAsync(e, getFocusables(slider.getCurrentSlideElement()).first())
							: onNextAsync(e, $nextFocusable); // wacEnteredClass가 없으면, slider 다음의 포커스 이동 가능 요소로 이동.

						// pager 마지막 요소의 다음 포커스 이동 요소의 shift-tab 이벤트 핸들러 동적으로 적용.
						!isEmpty(nextElShiftTabHandler)
							&& $.isFunction(nextElShiftTabHandler)
							&& !isEmpty($nextFocusable)
							&& wireUpEventAsync($nextFocusable, 'keydown', nextElShiftTabHandler);
					});
			};

			return lastPagerTabHandler;
		};

		/**
		 * bxSlider의 cont에서 shift-tab 입력시,
		 * 해당 cont의 pager로 focus이동 하는 shift-tab key event handler 반환.
		 *
		 * @param {object} slider bx-slider 객체.
		 * @param {object} cont bx-slider 하위의 cont li
		 * @param {object | function} prevEl shift-tab 시 focus 이동할 요소 또는 구하는 함수.
		 * @param {function} getPagerFocusablesFunc (선택) pager query 함수.
		 * @returns bxSlider의 cont에서 shift-tab 입력시,
		 */
		var getContShitTabHandler = function(slider, cont, prevEl, getPagerFocusablesFunc) {
			var $slider = getjQueryObj(slider), // 슬라이더 jQuery 객체.
				$cont = getjQueryObj(cont), // cont jQuery 객체.
				isPrevElByFunc = $.isFunction(prevEl), // prevEl(cont와 shift-tab으로 연결되는 요소)이 함수인지 여부.
				$prevEl = isPrevElByFunc // prevEl 함수 여부에 따라 대입.
					? prevEl
					: getjQueryObj(prevEl);

			var $contLi = getContLis($slider),
				contIdx = parseInt($contLi.index($cont));

			// bx-pager의 포커스 이동 가능한 요소를 구하는 함수가 선택인자이므로,
			getPagerFocusablesFunc = $.isFunction(getPagerFocusablesFunc)
				? getPagerFocusablesFunc // 인자함수 존재 시 인자함수 대입.
				: getFocusablePagerEls; // 인자함수가 없으면, 기본 함수 대입.

			var contShiftTabHandler = function(e) {
				isShiftTabEvent(e)
					&& $.utils.deferredAction(function() {
						var $focusablePagerEls = undefined,
							$focusablePagerEl = undefined,
							$nextEl = undefined; // 다음 포커스 이동 요소.

						if (contIdx === 0) { // 첫번째 cont인 경우,
							isPrevElByFunc
								? prevEl && ($nextEl = $prevEl()) // 함수로 prevEl을 구하는 경우, 함수 호출.
								: prevEl && ($nextEl = $prevEl); // $prevEl 대입.
						} else {
							// 'bx-pager'하위의 포커스 이동 가능 요소들을 구하는,
							// 기본함수가 $slider요소를 인자로 받는다.
							$focusablePagerEls = getPagerFocusablesFunc($slider);
							if (!isEmpty($focusablePagerEls)) { // 포커스 이동 가능한 'bx-pager'하위의 포커스 이동 가능 요소들이 존재하면,
								// 이전색인값으로 이동할 포커스 가능한 pager요소 조회.
								$focusablePagerEl = $focusablePagerEls.filter('[data-slide-index="' + (contIdx - 1) + '"]');
								// 이전색인값으로 조회한 이동할 포커스 가능한 pager요소가 없으면, (data-slide-index값에 대한 방어코드)
								$nextEl = isEmpty($focusablePagerEl)
									? $focusablePagerEls.eq(contIdx - 1) // 'bx-pager'하위의 포커스 이동 가능한 요소들 중에서 색인값으로 조회.
									: $focusablePagerEl;
							}
						}

						onNextAsync(e, $nextEl); // $nextEl 조회한 다음 요소로 이동.
					});
			};

			return contShiftTabHandler;
		};

		/**
		 * bxSlider의 cont에서 tab 입력시, 해당 cont의 다음 pager로 focus이동,
		 * 마지막 cont의 경우 마지막 pager로 이동 하는 tab key event handler 반환.
		 * (이벤트 중복 연결 검사를 위해서 hadler에 함수이름 할당.)
		 * 마지막 cont인 경우 nextEl이 존재하면, nextEl로 이동 그렇치 않으면 기본 이동.
		 *
		 * @param {object} slider bx-slider 객체.
		 * @param {object} cont bx-slider 하위의 cont li
		 * @param {object} nextEl tab event 시 이동할 요소.
		 * @param {function} getPagerFocusablesFunc (선택) pager query 함수.
		 * @returns bxSlider의 cont에서 tab 입력시, 해당 cont의 다음 pager로 focus이동,
		 */
		var getContTabHandler = function(slider, cont, nextEl, getPagerFocusablesFunc) {
			var $slider = getjQueryObj(slider), // slider jQuery 객체.
				$cont = getjQueryObj(cont), // cont인자의 jQuery객체.
				isNextElByFunc = $.isFunction(nextEl), // nextEl이 함수인지 여부.
				nextElGetter = undefined, // nextEl이 함수면, 생성하기 위한 변수.
				$nextEl = undefined, // 요소면 생성.
				$contLi = getContLis($slider), // contents list 조회.
				contIdx = parseInt($contLi.index($cont)); // cont인자의 색인값 조회.

			var contTabHandler = function(e) {
				isTabEvent(e)
					&& $.utils.deferredAction(function() {
						var $focusablePagerEls = undefined, // 포커스 이동 가능한 페이저요소.
							$nextElByIdx = undefined, // data-slide-index값으로 조회한 다음이동요소.
							$nextElement = undefined; // 최종 이동할 다음 이동요소.

						if (contIdx === parseInt($contLi.length - 1)) { // 마지막 content인 경우,
							$nextElement = isNextElByFunc ? nextElGetter() : $nextEl; // 슬라이더의 다음요소 조회.
						} else { // 마지막 content가 아니면,
							$focusablePagerEls = getPagerFocusablesFunc($slider); // 포커스 이동 가능한 pager요소 조회.
							if (!isEmpty($focusablePagerEls)) { // 포커스 이동 가능한 pager요소가 있으면,
								// data-slide-index로 다음 요소 이동.
								$nextElByIdx = $focusablePagerEls.filter('[data-slide-index="' + (contIdx) + '"]');
								// data-slide-index 미존재시, 방어코드.
								$nextElement = isEmpty($nextElByIdx)
									? $focusablePagerEls.eq(contIdx + 1)
									: $nextElByIdx;
							}
						}

						!isEmpty($nextElement)
							&& onNextAsync(e, $nextElement); // 포커스 이동.
					});
			};

			isNextElByFunc // tab event 시 이동할 요소가 함수로 조회인지 여부.
				? (nextElGetter = nextEl)
				: ($nextEl = getjQueryObj(nextEl));

			// 페이저 포커스 이동 가능 요소를 함수로 조회하는지 여부.
			getPagerFocusablesFunc = $.isFunction(getPagerFocusablesFunc)
				? getPagerFocusablesFunc
				: getFocusablePagerEls;

			return contTabHandler;
		};

		/**
		 * bxSlider의 pager와 cont 간의 focus이동 설정.
		 *
		 * @param {object} slider bx-slider 객체.
		 * @param {function | object} prevEl (선택) 첫번째 슬라이드에서 shift-tab event시 이동할 요소를 구하는 함수 또는 요소.
		 * @param {function | object} nextEl (선택) 마지막 슬라이드에서 tab event시 이동할 요소를 구하는 함수 또는 요소
		 * @param {function} getPagerFocusablesFunc (선택) pager focusables query 함수.
		 */
		var setFocusMoving = function(slider, prevEl, nextEl, getPagerFocusablesFunc) {
			var $slider = getjQueryObj(slider), // slider jQuery 객체.
				$focusablePagerEls = $.isFunction(getPagerFocusablesFunc) // ,
					? getPagerFocusablesFunc($slider) // getPagerFocusablesFunc 함수인자가 있으면, getPagerFocusablesFunc 함수인자 호출.
					: getFocusablePagerEls($slider), // getPagerFocusablesFunc 함수인자가 없으면, 기본 함수 호출.

				$contLi = getContLis($slider), // 슬라이더의 contents 요소 조회.
				contLiDeferredArr = [], // 비동기 호출을 위한 $.deferred 객체들을 저장하기 위한 배열변수.
				isByFunc = $.isFunction(prevEl) && $.isFunction(nextEl), // prevEl, nextEl 요소가 함수인지 여부.
				$prevArrow = $slider.closest('.bx-wrapper').find('.bx-prev');


			//슬라이드 이전 요소에서 슬라이드 안으로 촛점 진입 핸들러 : 첫 포커스 요소는 좌측방향 화살표
			var prevElTabHandler = function(e) {
				isTabEvent(e)
					&& $.utils.deferredAction(function() {
						//명절이후 체크!
						if (!isEmpty($focusablePagerEls)) {
							//onNextAsync(e, $focusablePagerEls.first());
							onNextAsync(e, $prevArrow);
						}
						//} else if (!isEmpty($contLi)) {
						//	slider.goToSlide(0);
						//	onNextAsync(e, getFocusables(slider.getCurrentSlideElement()).first());
						//}
					});
			};

			var nextElShiftTabHandler = function(e) {
				isShiftTabEvent(e)
					&& $.utils.deferredAction(function() {
						if (!isEmpty($focusablePagerEls)) {
							onNextAsync(e, $focusablePagerEls.last());
						}else if (!isEmpty($contLi)) {
							slider.goToSlide($contLi.length - 1);
							onNextAsync(e, getFocusables(slider.getCurrentSlideElement()).last());
						}
					});
			};

			var getDirectionFocusablesAsync = function($slider) {
				return $.utils.deferredAction(function() {
					return getFocusables($slider.closest('.bx-wrapper').find('.bx-controls-direction'));
				});
			};

			var directionLastFocusableTabHandler = function(e) {
				var $this = $(this),
					$contLis = getContLis($this),
					$currentCont = $contLis.filter('[aria-hidden=false]'),
					currentContIdx = $contLis.index($currentCont);

				!isEmpty(contTabHandlerArr[currentContIdx])
					&& $.isFunction(contTabHandlerArr[currentContIdx])
					&& contTabHandlerArr[currentContIdx](e);
			};

			$.utils.deferredAction(function() {
				// pager focus 이동 관련.
				$focusablePagerEls.each(function() {
					var $pagerEl = $(this),
						slideIdx = parseInt($pagerEl.data('slideIndex')),
						isFirst = slideIdx === 0,
						isLast = slideIdx === ($focusablePagerEls.length - 1),
						firstPagerShiftTabHandler = isFirst
							? getFirstPagerShiftTabHandler($pagerEl, prevEl, isFirst, prevElTabHandler)
							: undefined,
						pagerTabHandler = getPagerTabHandler(slider),
						lastPagerTabHandler = isLast
							? getLastPagerTabHanlder(slider, $pagerEl, nextEl, isLast, nextElShiftTabHandler)
							: undefined,
						pagerEnterHandler = getPagerEnterHandler($pagerEl, slider),
						pagerFocusoutHandler = getPagerFocusoutHandler();

					wireUpEventAsync($pagerEl, 'keydown', pagerEnterHandler);

					//isFirst
						//&& wireUpEventAsync($pagerEl, 'keydown', firstPagerShiftTabHandler);
					wireUpEventAsync($pagerEl, 'keydown', pagerTabHandler);
					isLast
						 && wireUpEventAsync($pagerEl, 'keydown', lastPagerTabHandler);
					wireUpEventAsync($pagerEl, 'focusout', pagerFocusoutHandler);
				});

				// contents focus 이동 관련.
				getDirectionFocusablesAsync($slider)
					.then(function($directionFocusables) {
						var contLiDeferredArr = [];

						$contLi.each(function(i, v) {
							var $cont = $(this);

							contLiDeferredArr.push($.utils.deferredAction(function() {
								var $contFocusables = getFocusables($cont),
									contShiftTabHandler = getContShitTabHandler(slider, $cont, prevEl, getPagerFocusablesFunc),
									contTabHandler = getContTabHandler(slider, $cont, nextEl, getPagerFocusablesFunc);

								!isEmpty($contFocusables)
									&& $.utils.deferredAction(function() {
										wireUpEventAsync($contFocusables.first(), 'keydown', contShiftTabHandler);

										isEmpty($directionFocusables)
											? wireUpEventAsync($contFocusables.last(), 'keydown', contTabHandler)
											: (function(i) {
												contTabHandlerArr[i] = contTabHandler;
												wireUpEventAsync($directionFocusables.last(), 'keydown', directionLastFocusableTabHandler)
											})(i);
									});
							}));
						});

						$.utils.deferredArrAction(contLiDeferredArr);
					});

				!isEmpty(prevEl)
					&& (!isEmpty($focusablePagerEls) || !isEmpty($contLi))
					&& $.utils.deferredAction(function() {
						var $prevEl = isByFunc
							? getjQueryObj(prevEl())
							: getjQueryObj(prevEl);

						!isEmpty($prevEl)
							&& wireUpEventAsync($prevEl, 'keydown', prevElTabHandler);
					});

				!isEmpty(nextEl)
					&& (!isEmpty($focusablePagerEls) || !isEmpty($contLi))
					&& $.utils.deferredAction(function() {
						var $nextEl = isByFunc
							? getjQueryObj(nextEl())
							: getjQueryObj(nextEl);

						!isEmpty($nextEl)
							&& wireUpEventAsync($nextEl, 'keydown', nextElShiftTabHandler);
					});
			});
		};

		/**
		 * bxSlider의 cont의 focus이벤트에 hover이벤트 연결
		 * (e.g focus이동시 자동슬라이드 멈춤 / focus 나갈 때 다시 자동슬라이드 동작.)
		 *
		 * @param {object} slider bx-slider 객체.
		 * @param {boolean} isAutoHover slider의 AutoHover 옵션값.
		 */
		var setHoverToFocusAsync = function(slider, isAutoHover) {
			return $.utils.deferredAction(function() {
				var $slider = getjQueryObj(slider);

				setAriaLiveAsync($slider);
				isAutoHover
					&& wireUpHoverToFocusAsync($slider);
			});
		};

		/**
		 * 네비 포커스 이동 시 자동슬라이드 멈춤.
		 *
		 * @param {any} slider slider bx-slider 객체.
		 * @param {function} getPagerFocusablesFunc (선택) (선택) pager focusables query 함수.
		 * @returns $.Deferred 객체.
		 */
		var WireUpContHoverToPagerFocusAsync = function(slider, getPagerFocusablesFunc) {
			var $slider = getjQueryObj(slider),
				$focusablePagerEls = $.isFunction(getPagerFocusablesFunc)
					? getPagerFocusablesFunc($slider)
					: getFocusablePagerEls($slider),
				$contLi = getContLis($slider);
			return $.utils.deferredAction(function() {
				$focusablePagerEls.each(function() {
					var $this = $(this),
						slideIdx = parseInt($this.data('slideIndex'));

					wireUpHoverToFocusAsync($this, $contLi.eq(slideIdx));
				});
			});
		};

		/**
		 * bxSlider의 pager와 cont 간의 focus이동 설정,
		 * bxSlider의 cont와 pager의 focus이벤트에 hover이벤트 연결.
		 * (prevEl과 nextEl 요소의 경우 변수가 많아서, 인자로 받아서 사용하는 방식으로 작성.)
		 * (pagerCustom을 설정한 경우 pagerCustom query function을 넘겨줘야 한다.)
		 *
		 * @param {object} slider bx-slider 객체.
		 * @param {boolean} isAutoHover autoHover 옵션값.
		 * @param {object} prevEl shift-tab event에 의해 슬라이더를 나갈 때, focus가 이동할 다음 요소.
		 * @param {object} nextEl tab event에 의해 슬라이더를 나갈 때, focus가 이동할 다음 요소.
		 * @param {function} getPagerFocusablesFunc (선택) pager query 함수.
		 */
		var setAccessibility = function(slider, isAutoHover, prevEl, nextEl, getPagerFocusablesFunc) {
			setHoverToFocusAsync(slider, isAutoHover);
			(!isEmpty(prevEl) && !isEmpty(nextEl))
				&& setFocusMoving(slider, prevEl, nextEl, getPagerFocusablesFunc);
			WireUpContHoverToPagerFocusAsync(slider, getPagerFocusablesFunc);
		};

		return {
			setAccessibility: setAccessibility
		};
	}();

	/**
	 * slick slider 웹접근성 관련.
	 */
	var slick = function() {
		var slickPrevShiftTabHandlerArr = [],
			contTabHandlerArr = [];

		/**
		 * slickSlider의 pager와 cont 간의 focus 이동 설정.
		 *
		 * @param {object} slider slick-slider 객체.
		 * @param {object | function} prevEl (선택) 첫번째 슬라이드에서 shift-tab event시 이동할 요소 또는 조회 함수.
		 * @param {object | function} nextEl (선택) 마지막 슬라이드에서 tab event시 이동할 요소 또는 조회 함수.
		 * @param	{function} getPagerFocusablesFunc (선택) pager query 함수.
		 */
		var setFocusMoving = function(slider, prevEl, nextEl, getPagerFocusablesFunc) {
			var $slider = isjQueryObj(slider) ? slider : slider.$slider,
				isByFunc = $.isFunction(prevEl) && $.isFunction(nextEl),
				$prevEl = isByFunc ? getjQueryObj(prevEl()) : getjQueryObj(prevEl),
				$nextEl = isByFunc ? getjQueryObj(nextEl()) : getjQueryObj(nextEl), // 슬라이더 다음 요소의 jQuery객체.
				$navFocusables = $.isFunction(getPagerFocusablesFunc)
					? getjQueryObj(getPagerFocusablesFunc($slider))
					: getjQueryObj(getFocusables($slider.find('.slick-dots'))),
				$slides = getjQueryObj(slider.$slides),
				$slickPrev = undefined,
				$slickNext = undefined;

			var getSlickPrevKeydownHandler = function(shiftTabEl, tabEl) {
				var slickPrevKeydownHandler = function(e) {
					isShiftTabEvent(e)
						&& onNextAsync(e, $prevEl);

					isTabEvent(e)
						&& onNextAsync(e, tabEl);
				};

				return slickPrevKeydownHandler;
			};

			var slickPrevKeydownHanlderCaller = function(e) {
				var $target = $(e.target),
					slideIdx = getSlickActiveSliderIdx($target);

				$.isFunction(slickPrevShiftTabHandlerArr[slideIdx])
					&& slickPrevShiftTabHandlerArr[slideIdx](e);
			};

			var getContLastFocusableKeydownHandler = function(shiftTabEl, tabEl) {
				var contLastFocusableKeydownHandler = function(e) {
					isShiftTabEvent(e)
						&& onNextAsync(e, shiftTabEl);

					isTabEvent(e)
						&& onNextAsync(e, tabEl);
				};

				return contLastFocusableKeydownHandler;
			};

			// 포커스 이동이 bx-slider와 동일하게 하기 위해서 추가.
			// 런타임에 현재 슬라이드의 색인을 구하는 부분
			//(슬라이드의 색인을 구하는 로직은 다른방식을 고민할 필요가 있어보인다.)
			var getSlickActiveSliderIdx = function(slideChild) {
				var $slideChild = getjQueryObj(slideChild),
					$section = $slideChild.closest('section'),
					$activeSlide = $section.find('[aria-hidden="false"]'),
					slideIdx = $activeSlide.data('slickIndex');

				return slideIdx;
			};

			var getSlickNextKeydownHandler = function($slickPrev) {

				var slickNextKeydownHandler = function(e) {
					var $target = $(e.target),
						slideIdx = getSlickActiveSliderIdx($target);
					isTabEvent(e)
						//&& $.isFunction(contTabHandlerArr[slideIdx])
						//&& contTabHandlerArr[slideIdx](e);
						&& onNextAsync(e, $target.next().find('.slick-active>button'));

					isShiftTabEvent(e)
						&& onNextAsync(e, $slickPrev);
				};

				return slickNextKeydownHandler;
			};

			var navKeydownHandler = function(e) {

				var $this = $(this),
					currentIdx = $this.attr('slide-index')
						? parseInt($this.data('slideIndex'))
						: parseInt($navFocusables.index($this)),
					isFirst = currentIdx === 0,
					isLast = currentIdx === ($navFocusables.length - 1);

				isEnterEvent(e)
					&& $.utils.deferredAction(function() {
						markWacEnteredAsync($this, function() {
							slider.slickGoTo(currentIdx, true);
						});
					});

				isShiftTabEvent(e)
					&& (isFirst
						? isByFunc
							//? onNextAsync(e, getjQueryObj(prevEl()))
							//: onNextAsync(e, $prevEl)
							? onNextAsync(e, $slickNext)
							: onNextAsync(e, $slickNext)
						: onNextAsync(e, $navFocusables.eq(currentIdx - 1)));

				isTabEvent(e)
					&& (function(e) {
						isWacEntered($this)
							? onNextAsync(e, getFocusables($slides.eq(currentIdx)).first()) // wacEnteredClass 존재시 contents로 이동.
							: onNextAsync(e, $navFocusables.eq(currentIdx + 1));
					})(e);
			};

			var prevElTabHandler = function(e) {
				isTabEvent(e)
					&& (function(e) {
						if(!isEmpty($slickPrev)){
							onNextAsync(e, $slickPrev);
						}else if (!isEmpty($navFocusables)) {
							onNextAsync(e, $navFocusables.first());
						} else if (!isEmpty($slides)) {
							slider.slickGoTo(0, true);
							onNextAsync(e, getFocusables($slides.first()).first());
						}
					})(e);
			};

			var nextElShiftTabHandler = function(e) {
				isShiftTabEvent(e)
					&& (function(e) {
						if (!isEmpty($navFocusables)) {
							onNextAsync(e, $navFocusables.last());
						} else if (!isEmpty($slides)) {
							slider.slickGoTo($slides.length - 1, true);
							onNextAsync(e, getFocusables($slides.last()).last());
						}
					})(e);
			};

			var navFocusoutHandler = function(e) {
				var $this = $(this);

				setTimeout(function() {
					removeWacEnteredAsync($this);
				}, 100);
			};

			var getDirectionFocusablesAsync = function($wrapNav) {
				return $.utils.deferredAction(function() {
					return isEmpty($wrapNav)
						? undefined
						: $wrapNav.find('.slick-prev, .slick-next');
				});
			};

			getDirectionFocusablesAsync($slider.closest('section'))
				.done(function(directionFocusables) {
					$slickPrev = directionFocusables.filter('.slick-prev');
					$slickNext = directionFocusables.filter('.slick-next');
				});

			$slides.each(function() {
				var $this = $(this),
					$focusables = getFocusables($this); // 슬라이드내의 포커스 이동 가능 요소.

				getFocusableInfoAsync($slides, $this) // 슬라이드목록으로 부터 슬라이드의 정보조회.
					.done(function(slideInfo) {
						var contShiftTabHandler = function(e) {
							var $this = $(this);

							isShiftTabEvent(e)
								&& $.utils.deferredAction(function() {
									// 슬라이드내의 포커스 이동 가능 요소로 부터 현재 요소의 정보조회.

									getFocusableInfoAsync($focusables, $this)
										.then(function(info) {
											info.isFirst // 현재 요소가 슬라이드네 포커스 이동가능 요소 중 첫번재 요소인지 여부.
												&& (slideInfo.isFirst // 첫번째 슬라이드인지 여부.
													// 첫번째 슬라이드의 첫번째 포커스 가능요소면 슬라이더 이전 포커스 이동 가능 요소로 이동.
													? isByFunc ? onNextAsync(e, getjQueryObj(prevEl())) : onNextAsync(e, $prevEl)
													// 첫번째 슬라이드의 첫번째 포커스 가능요소가 아니면,
													// 현재슬라이드의 색인 이전 색인과 일치하는 포커스 이동 가능한 네비 요소로 이동.
													: onNextAsync(e, $navFocusables.eq(slideInfo.idx - 1)));
										});
								});
						};

						var contTabHandler = function(e) {
							var $this = $(this);
							isTabEvent(e)
								&& $.utils.deferredAction(function() {
								// 슬라이드내의 포커스 이동 가능 요소로 부터 현재 요소의 정보조회.

									getFocusableInfoAsync($focusables, $this)
									.done(function(info) {
										info.isLast // 현재 요소가 슬라이드내의 마지막 요소인지 여부.
											&& $.utils.deferredAction(function() {
												getDirectionFocusablesAsync($this.closest('section'))
													.done(function(directionFocusables) {
														var deferredArr = []; // $.deferred 저장용 배열.

														$slickPrev = directionFocusables.filter('.slick-prev'); // 이전 direction 요소.
														$slickNext = directionFocusables.filter('.slick-next'); // 다음 direction 요소.

														!isEmpty($slickPrev)
															&& (function() {
																deferredArr.push(
																	$.utils.deferredAction(function() {
																		slickPrevShiftTabHandlerArr[slideInfo.idx] = getSlickPrevKeydownHandler($this, $slickNext);
																	}).done(function(slickPrevKeydownHandler) {
																		wireUpEventAsync($slickPrev, 'keydown', slickPrevKeydownHanlderCaller);
																	})
																)
															})();

														!isEmpty($slickNext)
															&& (function() {
																deferredArr.push(
																	$.utils.deferredAction(function() {
																		var slickNextEl = slideInfo.isLast
																			? $nextEl
																			: $navFocusables.eq(slideInfo.idx + 1),
																			contLastFocusableKeydownHandler = getContLastFocusableKeydownHandler($slickPrev, slickNextEl);

																		contTabHandlerArr[slideInfo.idx] = contLastFocusableKeydownHandler;

																		return $slickPrev;
																	}).done(function(paramObj) {
																		wireUpEventAsync(
																			$slickNext,
																			'keydown',
																			getSlickNextKeydownHandler($slickPrev)
																		);
																	})
																);
															})();

														!isEmpty(directionFocusables)
															? $.utils.deferredArrAction(deferredArr) // direction요소가 있는경우.
																.done(function() {

																	if(!isEmpty($navFocusables)){
																		onNextAsync(e, $slider.find('.slick-dots>.slick-active>button'));

																	}
																	else if(isEmpty($navFocusables)){
																		isEmpty($slickPrev)
																			? onNextAsync(e, $slickNext)
																			: onNextAsync(e, $slickPrev);
																	}
																})
															: onNextAsync(e, $nextEl); // direction 요소가 없으면, 슬라이더 다음 요소로 focus 이동.
													});
											});
									});
								});
						};

						$focusables.each(function(i, v) {
							var $focusable = $(this);

							wireUpEventAsync($focusable, 'keydown', contShiftTabHandler);
							wireUpEventAsync($focusable, 'keydown', contTabHandler);
						});
					});
			});

			$navFocusables.each(function() {
				var $this = $(this);

				wireUpEventAsync($this, 'keydown', navKeydownHandler);
				wireUpEventAsync($this, 'focusout', navFocusoutHandler);
			});

			// 슬라이더 이전 포커스가능 요소에 대한 tab key 이벤트핸들러 바인딩.
			!isEmpty($prevEl)
				&& (!isEmpty($navFocusables) || !isEmpty($slides))
				&& wireUpEventAsync($prevEl, 'keydown', prevElTabHandler);

			// 슬라이더 다음 포커스가능 요소에 대한 shift-tab key 이벤트핸들러 바인딩.
			!isEmpty($nextEl)
				&& (!isEmpty($navFocusables) || !isEmpty($slides) || !isEmpty($slickPrev) || !isEmpty($slickNext))
				&& wireUpEventAsync($nextEl, 'keydown', nextElShiftTabHandler);
		};

		/**
		 * slickSlider의 cont의 focus이벤트에 hover이벤트 연결.
		 * (e.g focus이동시 자동슬라이드 멈춤 / focus 나갈 때 다시 자동슬라이드 동작.)
		 *
		 * @param {object} slider slickSlider 객체
		 * @param {boolean} isAutoPlay slickSlider의 autoplay 옵션값.
		 */
		var setHoverToFocusAsync = function(slider, isAutoPlay) {
			return $.utils.deferredAction(function() {
				var $slider = slider.$slider;

				setAriaLiveAsync($slider);

				return {
					$slider: $slider,
					isAutoPlay: isAutoPlay
				};
			}).then(function(paramObj) {
				paramObj.isAutoPlay
					&& (function() {
						var focusables = getFocusables(paramObj.$slider),
							deferredArr = [];

						focusables.each(function() {
							var $this = $(this);

							deferredArr.push(wireUpHoverToFocusAsync($this));
						});

						$.utils.deferredArrAction(deferredArr);
					})();
			});
		};

		var WireUpContHoverToPagerFocusAsync = function(slider, getPagerFocusablesFunc) {
			var $slider = slider.$slider,
				$navFocusables = $.isFunction(getPagerFocusablesFunc)
					? getjQueryObj(getPagerFocusablesFunc($slider))
					: getjQueryObj(getFocusables($slider.find('.slick-dots'))),
				$slides = getjQueryObj(slider.$slides);

			return $.utils.deferredAction(function() {
				$navFocusables.each(function() {
					var $this = $(this),
						slideIdx = parseInt($this.data('slideIndex')) || parseInt($navFocusables.index($this));

					wireUpHoverToFocusAsync($this, $slides.eq(slideIdx));
				});
			});
		};

		/**
		 * slick슬라이더의 pager와 cont간의 focus이동을 설정하고,
		 * slick슬라이더의 cont와 pager의 focus이벤트에 hover 이벤트 연결
		 * (prevEl과 nextEl 요소의 경우 변수가 많아서, 인자로 받아서 사용하는 방식으로 작성.)
		 * runtime에 prevEl, nextEl 요소를 구하는 경우, prevEl, nextEl을 함수 인자로 작성.
		 *
		 * @param {object} slider slickSlider객체.
		 * @param {boolean} isAutoPlay slickSlider의 autoplay 옵션값.
		 * @param {object | function} prevEl shift-tab event에 의해 슬라이더를 나갈 때, focus가 이동할 다음 요소 또는 조회 함수.
		 * @param {object | function} nextEl tab event에 의해 슬라이더를 나갈 때, focus가 이동할 다음 요소 또는 조회 함수.
		 */
		var setAccessibility = function(slider, isAutoPlay, prevEl, nextEl, getPagerFocusablesFunc) {
			setHoverToFocusAsync(slider, isAutoPlay);
			(!isEmpty(prevEl) && !isEmpty(nextEl))
				&& setFocusMoving(slider, prevEl, nextEl, getPagerFocusablesFunc);
			WireUpContHoverToPagerFocusAsync(slider, getPagerFocusablesFunc);
		};

		return {
			setAccessibility: setAccessibility,
		};
	}();

	var datePickerControl = function() {
		var _calendar = '.ui-datepicker-trigger',
			$clickedEl = undefined;

		var getFocusHandler = function($calendarLayer) {
			var focusHandler = function(e) {
				onNextAsync(e, $calendarLayer.find('.ui-state-active'));
			};

			return focusHandler;
		};

		var monthBtnClickHandler = function(e) {
			$clickedEl = $(this);
			preventDefaultAction(e);
		};

		var changeHandler = function(e) {
			var $target = $(e.target);
			$target.next(_calendar).focus();
		};

		var domNodeInsertedHandler = function(e) {
			var $monthBtn = $('.ui-datepicker-header [data-event="click"]');

			isEmpty($monthBtn.attr('href'))
				&& $monthBtn.attr({
					'href': '#'
				});
			wireUpEventAsync($monthBtn, 'click', monthBtnClickHandler);

			!isEmpty($clickedEl)
				&& setTimeout(function() {
					$.utils.deferredAction(function() {
						$clickedEl.hasClass('ui-datepicker-next')
							&& onNextAsync(e, $('.ui-datepicker-next'))

						$clickedEl.hasClass('ui-datepicker-prev')
							&& onNextAsync(e, $('.ui-datepicker-prev'))
					});
				}, 0);
		};

		var wireUpEvents = function($calendar, $dateInput, $calendarLayer) {
			wireUpEventAsync($calendar, 'click', getFocusHandler($calendarLayer));
			wireUpEventAsync($dateInput, 'change', changeHandler);
			wireUpEventAsync($calendarLayer, 'DOMNodeInserted', domNodeInsertedHandler);
		};

		var initAsync = function() {
			var $contents = $('#contents'),
				$datepicker = $contents.find('.calendar'),
				$calendar = $contents.find(_calendar),
				$dateInput = $calendar.prev('.calendar'),
				$calendarLayer = $('.ui-datepicker');

			return !isEmpty($datepicker)
				&& $.utils.deferredAction(function() {
					wireUpEvents($calendar, $dateInput, $calendarLayer);
				});
		};

		return {
			initAsync: initAsync,
		};
	}();

	var basketTabHandler = function() {
		var $baksetBtn = null;

		return {
			tabEvent: function(element) {
				var _this = this,
					$element = $baksetBtn = $(element);

				$element
					.off('keydown.Event')
					.on('keydown.Event', $.proxy(_this.keyDownEvent, _this));
			},
			keyDownEvent: function(e) {
				var _this = this;

				if (_wac.isTabEvent(e)) _this.focusEvent();
			},
			focusEvent: function() {
				var $option = $('.basket-option'),
					$complete = $('.layerpop-toast-btm'),
					_option = $baksetBtn.data('option-yn'),
					_optionCloseClass = '.btn-ico-close',
					_completeCloseClass = '.btn-close',
					$nextHiddenBtn = $('<a href="javascript:;" class="blind">Next hidden button</a>');

				function firstFocus($isLayer, isElement) {
					setTimeout(function() {
						$isLayer.find(isElement + ':first').focus();
						$nextHiddenBtn.appendTo($isLayer);
					}, 20)
				}

				function closeNextFocus($layer, closeBtn) {

					function focusMove() {
						setTimeout(function() {
							$baksetBtn.focus();
						}, 20);
					}
					$layer
						.off('keydown.Event')
						.on('keydown.Event', closeBtn, function(e) {
							if (_wac.isEnterEvent(e)) {
								// enter
								focusMove();
							} else if (_wac.isTabEvent(e)) {
								// tab
								$closeBtn.trigger('click');
								focusMove();

								return false;
							}
						});
				}

				if (_option == 'Y') {
					var $body = $('body'),
						_layerToastClasee = '.layerpop-toast-btm';

					// 옵션 장바구니
					firstFocus($option, 'select');
					closeNextFocus($option, _optionCloseClass);

					$body
						.off('DOMNodeInserted.optionLayer')
						.on('DOMNodeInserted.optionLayer', _layerToastClasee, function() {
							closeNextFocus($(_layerToastClasee), _completeCloseClass);
						});
				} else {
					// complete
					firstFocus($complete, 'button');
					closeNextFocus($complete, _completeCloseClass);
				}
			}
		}
	}();

	/**
	 * script 종속성 방어 함수.
	 *
	 * @param {object} options ajax 요청 옵션.
	 * @returns "/js/jquery/jquery.utils.js" script를 로딩하는 promise 객체.
	 */
	var dependRequiredScriptsAsync = function(options) {
		var cachedScript = function(url, options) {
			options = $.extend(options || {}, {
				dataType: "script",
				cache: true,
				url: url,
			});
			return $.ajax(options);
		};

		var getDummyPromise = function() {
			var $deferred = $.Deferred();

			$deferred.resolve(undefined);
			return $deferred.promise();
		};

		return (isEmpty($.utils))
			? cachedScript('/js/jquery/jquery.utils.js', options)
			: getDummyPromise();
	};

	/**
	 * 전역 이벤트들.
	 *
	 */
	var domOnReady = function() {
		var ua = window.navigator.userAgent,
			isIE = ua.indexOf("MSIE ") > 0,
			IEversion = isIE && parseFloat(navigator.appVersion.split("MSIE")[1]
				.split(";")[0]
				.split(" ")
				.join(""));

		// ie8 오류방지용 polyfill
		var setPolyfill = function() {
			// Production steps of ECMA-262, Edition 5, 15.4.4.18
			// Reference: http://es5.github.io/#x15.4.4.18
			if (!Array.prototype.forEach) {

				Array.prototype.forEach = function(callback/*, thisArg*/) {

					var T, k;

					if (this == null) {
						throw new TypeError('this is null or not defined');
					}

					// 1. Let O be the result of calling toObject() passing the
					// |this| value as the argument.
					var O = Object(this);

					// 2. Let lenValue be the result of calling the Get() internal
					// method of O with the argument "length".
					// 3. Let len be toUint32(lenValue).
					var len = O.length >>> 0;

					// 4. If isCallable(callback) is false, throw a TypeError exception.
					// See: http://es5.github.com/#x9.11
					if (typeof callback !== 'function') {
						throw new TypeError(callback + ' is not a function');
					}

					// 5. If thisArg was supplied, let T be thisArg; else let
					// T be undefined.
					if (arguments.length > 1) {
						T = arguments[1];
					}

					// 6. Let k be 0.
					k = 0;

					// 7. Repeat while k < len.
					while (k < len) {

						var kValue;

						// a. Let Pk be ToString(k).
						//    This is implicit for LHS operands of the in operator.
						// b. Let kPresent be the result of calling the HasProperty
						//    internal method of O with argument Pk.
						//    This step can be combined with c.
						// c. If kPresent is true, then
						if (k in O) {

							// i. Let kValue be the result of calling the Get internal
							// method of O with argument Pk.
							kValue = O[k];

							// ii. Call the Call internal method of callback with T as
							// the this value and argument list containing kValue, k, and O.
							callback.call(T, kValue, k, O);
						}
						// d. Increase k by 1.
						k++;
					}
					// 8. return undefined.
				};
			}

			if (!Array.prototype.every) {
				Array.prototype.every = function(callbackfn, thisArg) {
					'use strict';
					var T, k;

					if (this == null) {
						throw new TypeError('this is null or not defined');
					}

					// 1. Let O be the result of calling ToObject passing the this
					//    value as the argument.
					var O = Object(this);

					// 2. Let lenValue be the result of calling the Get internal method
					//    of O with the argument "length".
					// 3. Let len be ToUint32(lenValue).
					var len = O.length >>> 0;

					// 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
					if (typeof callbackfn !== 'function') {
						throw new TypeError();
					}

					// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
					if (arguments.length > 1) {
						T = thisArg;
					}

					// 6. Let k be 0.
					k = 0;

					// 7. Repeat, while k < len
					while (k < len) {

						var kValue;

						// a. Let Pk be ToString(k).
						//   This is implicit for LHS operands of the in operator
						// b. Let kPresent be the result of calling the HasProperty internal
						//    method of O with argument Pk.
						//   This step can be combined with c
						// c. If kPresent is true, then
						if (k in O) {

							// i. Let kValue be the result of calling the Get internal method
							//    of O with argument Pk.
							kValue = O[k];

							// ii. Let testResult be the result of calling the Call internal method
							//     of callbackfn with T as the this value and argument list
							//     containing kValue, k, and O.
							var testResult = callbackfn.call(T, kValue, k, O);

							// iii. If ToBoolean(testResult) is false, return false.
							if (!testResult) {
								return false;
							}
						}
						k++;
					}
					return true;
				};
			}

			// Production steps of ECMA-262, Edition 5, 15.4.4.17
			// Reference: http://es5.github.io/#x15.4.4.17
			if (!Array.prototype.some) {
				Array.prototype.some = function(fun/*, thisArg*/) {
					'use strict';

					if (this == null) {
						throw new TypeError('Array.prototype.some called on null or undefined');
					}

					if (typeof fun !== 'function') {
						throw new TypeError();
					}

					var t = Object(this);
					var len = t.length >>> 0;

					var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
					for (var i = 0; i < len; i++) {
						if (i in t && fun.call(thisArg, t[i], i, t)) {
							return true;
						}
					}

					return false;
				};
			}

			// Production steps of ECMA-262, Edition 5, 15.4.4.19
			// Reference: http://es5.github.io/#x15.4.4.19
			if (!Array.prototype.map) {

				Array.prototype.map = function(callback/*, thisArg*/) {

					var T, A, k;

					if (this == null) {
						throw new TypeError('this is null or not defined');
					}

					// 1. Let O be the result of calling ToObject passing the |this|
					//    value as the argument.
					var O = Object(this);

					// 2. Let lenValue be the result of calling the Get internal
					//    method of O with the argument "length".
					// 3. Let len be ToUint32(lenValue).
					var len = O.length >>> 0;

					// 4. If IsCallable(callback) is false, throw a TypeError exception.
					// See: http://es5.github.com/#x9.11
					if (typeof callback !== 'function') {
						throw new TypeError(callback + ' is not a function');
					}

					// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
					if (arguments.length > 1) {
						T = arguments[1];
					}

					// 6. Let A be a new array created as if by the expression new Array(len)
					//    where Array is the standard built-in constructor with that name and
					//    len is the value of len.
					A = new Array(len);

					// 7. Let k be 0
					k = 0;

					// 8. Repeat, while k < len
					while (k < len) {

						var kValue, mappedValue;

						// a. Let Pk be ToString(k).
						//   This is implicit for LHS operands of the in operator
						// b. Let kPresent be the result of calling the HasProperty internal
						//    method of O with argument Pk.
						//   This step can be combined with c
						// c. If kPresent is true, then
						if (k in O) {

							// i. Let kValue be the result of calling the Get internal
							//    method of O with argument Pk.
							kValue = O[k];

							// ii. Let mappedValue be the result of calling the Call internal
							//     method of callback with T as the this value and argument
							//     list containing kValue, k, and O.
							mappedValue = callback.call(T, kValue, k, O);

							// iii. Call the DefineOwnProperty internal method of A with arguments
							// Pk, Property Descriptor
							// { Value: mappedValue,
							//   Writable: true,
							//   Enumerable: true,
							//   Configurable: true },
							// and false.

							// In browsers that support Object.defineProperty, use the following:
							// Object.defineProperty(A, k, {
							//   value: mappedValue,
							//   writable: true,
							//   enumerable: true,
							//   configurable: true
							// });

							// For best browser support, use the following:
							A[k] = mappedValue;
						}
						// d. Increase k by 1.
						k++;
					}

					// 9. return A
					return A;
				};
			}
		};

		var wireUpEvents = function() {
			var $martBookMarkWrap = $('.mart-bookmark-wrap'),
				$pushNav = $('.push-nav'),
				$adAside = $('.ad-aside'),

				$catNavi = $('#catNavi'),

				$myMartWrapper = $('.wrap-mymart.wrap-drop-down').first(),
				$myMartWrapperLastFocusable = !isEmpty($myMartWrapper) && getFocusables($myMartWrapper).last(),
				$inputCalender = $('input.calendar');

			isEmpty($catNavi)
				&& ($catNavi = $('.wrap-location').first());

			// 바로가기 레이어팝업 focus 임시 적용 20171127
			// 이벤트바인딩 중복제거를 위해 리펙토링. 20180404
			!isEmpty($martBookMarkWrap)
				&& $.utils.deferredAction(function() {
					var martBookMarkWrapFocusInHandler = function(e) {
						var $this = $(this),
							$wrap = $this.closest('.mart-bookmark-wrap');

						$.utils.deferredAction(
							function() {
								$this.trigger('mouseover'); // 레이어를 jquery.book-mark.js에서 생성 중
								$wrap.addClass('active');
								$wrap.find('.layerpop-bookmark').show();

								return {
									$layer: $wrap.find('.layerpop-bookmark'),
									$wrap: $wrap,
									$this: $this
								};
							}).then(function(params) {
								var layerFocusoutHanlder = function(e) {
									params.$this.trigger('mouseout');
									params.$wrap.hasClass('active')
										&& params.$wrap.removeClass('active');
								};

								wireUpEventAsync(getFocusables(params.$layer).first(), 'focusout', layerFocusoutHanlder);
								wireUpEventAsync(getFocusables(params.$layer).last(), 'focusout', layerFocusoutHanlder);

								return params;
							}).then(function(params) {
								var $wrapFirstFocusable = getFocusables($wrap).first();
								var martBookMarkWrapFirstFocusableShiftTabHandler = function(e) {
									var $this = $(this);

									isShiftTabEvent(e)
										&& $.utils.deferredAction(function() {
											params.$wrap.hasClass('active')
												&& params.$wrap.removeClass('active');
											params.$layer.hide();
										});
								};
								wireUpEventAsync($wrapFirstFocusable, 'keydown', martBookMarkWrapFirstFocusableShiftTabHandler);
							});
					};

					wireUpEventAsync(
						$martBookMarkWrap,
						'focusin',
						martBookMarkWrapFocusInHandler,
						'.mart-bookmark'
					);
				});

			// GNB 트렌드 레이어팝업 focus 접근성 임시 적용 20171127
			// 이벤트 바인딩 중복제거를 위해 리펙토링 20180405
			!isEmpty($pushNav)
				&& $.utils.deferredAction(function() {
					var DomNodeInsertedHanlder = function(e) {
						var $wrap = $pushNav.find('.wrap-toggle'),
							$wrapFirstFocusable = _wac.getFocusables($wrap).first(),
							$subNav = $wrap.find('.wrap-subnav'),
							$subNavfocusables = _wac.getFocusables($subNav),
							$subNavLast = $subNavfocusables.last();

						var wireUpEvents = function() {
							var wrapHoverFocusinHandler = function(e) {
								!$wrap.hasClass('active')
									&& $wrap.addClass('active');
							};

							var wrapMouseoutHandler = function(e) {
								$wrap.hasClass('active')
									&& $wrap.removeClass('active');
							};

							var wrapFirstFocusableShiftTabHandler = function(e) {
								var $this = $(this);

								_wac.isShiftTabEvent(e)
									&& $wrap.hasClass('active')
									&& $wrap.removeClass('active');
							};

							var subNavLastTabHandler = function(e) {
								_wac.isTabEvent(e)
									&& $wrap.hasClass('active')
									&& $wrap.removeClass('active');
							};

							wireUpEventAsync($wrapFirstFocusable, 'focusin mouseover', wrapHoverFocusinHandler);
							wireUpEventAsync($wrapFirstFocusable, 'mouseout', wrapMouseoutHandler);
							wireUpEventAsync($wrapFirstFocusable, 'keydown', wrapFirstFocusableShiftTabHandler);
							wireUpEventAsync($subNavLast, 'keydown', subNavLastTabHandler);
							wireUpEventAsync($subNav, 'mouseover', wrapHoverFocusinHandler);
							wireUpEventAsync($subNav, 'mouseout', wrapMouseoutHandler);
						};

						($wrap && $subNav)
							&& $.utils.deferredAction(wireUpEvents);
					};

					wireUpEventAsync($pushNav, 'DOMNodeInserted', DomNodeInsertedHanlder);
				});

			!isEmpty($adAside)
				&& !isEmpty($martBookMarkWrap)
				&& $.utils.deferredAction(function() {
					var asideBannerFirstDomNodeInsertedHandler = function(e) {
						var asideBannerFirst = $adAside.find('.aside-banner').not('.smartPick-banner').first();

						!isEmpty(asideBannerFirst)
							&& $.utils.deferredAction(function() {
								var $martBookMarkWrapNextFocusables = getFocusables($martBookMarkWrap.next());
								var martBookMarkWrapNextFocusableShiftTabHandler = function(e) {
									isShiftTabEvent(e)
										&& $.utils.deferredAction(function() {
											setTimeout(function() {
												var $martBookMarkWrapLastFocusable = getFocusables(
													$martBookMarkWrap.find('.layerpop-bookmark')
												).last();

												!isEmpty($martBookMarkWrapLastFocusable)
													&& $.utils.deferredAction(function() {
														$martBookMarkWrap.trigger('mouseenter');
														onNextAsync(e, $martBookMarkWrapLastFocusable)
													});
											}, 0);
										});
								};

								$martBookMarkWrapNextFocusables.each(function() {
									var $this = $(this);
									wireUpEventAsync($this, 'keydown', martBookMarkWrapNextFocusableShiftTabHandler);
								});
							});
					};

					wireUpEventAsync($adAside, 'DOMNodeInserted', asideBannerFirstDomNodeInsertedHandler);
				});

			// gnb 마지막 메뉴 다음 포커스 이동 요소의 shift-tab event 연결.
			!isEmpty($catNavi)
				&& $.utils.deferredAction(function() {
					var $nextElOfGnbLast = getFocusables($catNavi.find('.location')).first();
					var catNaviDOMNodeInsertedHandler = function(e) {
						// 재탐색
						$nextElOfGnbLast = getFocusables($catNavi.find('.location')).first();

						!isEmpty($nextElOfGnbLast)
							&& wireUpShiftTabEventOnNextElOfGnbLast($nextElOfGnbLast);
					};

					isEmpty($nextElOfGnbLast)
						&& wireUpEventAsync($catNavi, 'DOMNodeInserted', catNaviDOMNodeInsertedHandler);

					!isEmpty($nextElOfGnbLast)
						&& wireUpShiftTabEventOnNextElOfGnbLast($nextElOfGnbLast);
				});

			// 마이롯데 다음 포커스 이동 요소의 shift-tab event 연결.
			!isEmpty($myMartWrapperLastFocusable)
				&& $.utils.deferredAction(function() {
					var shiftTabHandler = function(e) {
						isShiftTabEvent(e)
							&& !isEmpty($myMartWrapperLastFocusable)
							&& $.utils.deferredAction(function() {
								$myMartWrapper.addClass('active');
								onNextAsync(e, getFocusables($myMartWrapper).last());
							});
					};

					var getNext = function(el) {
						var $el = getjQueryObj(el),
							$returnVal = undefined;

						while (isEmpty($returnVal)) {
							$el = getNextFocusable($el, 'next');
							if (isEmpty($el)) {
								break;
							} else {
								$returnVal = $el.not('input[type=hidden]');
							}
						}

						return $returnVal;
					};

					getNextFocusableAsync($myMartWrapper.closest('.wrap-header-utill'), 'next')
						.done(function(nextFocusable) {
							var $firstFocusableOfMyMartNext = nextFocusable
								|| getNext($myMartWrapper.closest('#header')); // 고객센터페이지

							wireUpEventAsync($firstFocusableOfMyMartNext, 'keydown', shiftTabHandler);
						});
				});

			!isEmpty($inputCalender)
				&& $('input.calendar').datepicker();
		};

		$.utils.deferredAction(function() {
			(isIE && (IEversion <= 8.0))
				&& setPolyfill();
		}).done(function() {
			!isEmpty($.utils)
				&& $.utils.deferredAction(wireUpEvents);

			datePickerControl.initAsync();

			$.fn.inputOrdQtyRange
				&& $('.spinner-input').inputOrdQtyRange();
		})
	};

	$(function() {
		dependRequiredScriptsAsync().done(function() {
			$.utils.deferredAction(domOnReady);
		});
	});


	/*
	 * 2018.07.20 ADD BY 원은재
	 * [gnb_category.jsp] 전체 카테고리 3단 메뉴의 키보드 이벤트에서 사용되는 모션 핸들러
	 * 3단 중첩 메뉴 내 포커스의 이동 && 하위메뉴 열고 접는 기능
	 *
	 * @param {object} e event객체.
	 * @param {string} motion 모션의 이름.
	 */
		var gnbMenuMotionHandler = function(e, motion){
			var $nowFocus = $(e.target);
				//이전 요소로 초점 이동
				if(motion == "beforeFocus"){
					$nowFocus.parent().prev().children().focus();
				}
				//다음 요소로 초점 이동
				else if(motion == "nextFocus"){
					$nowFocus.parent().next().children().focus();
				}
				//자식메뉴 열기
				else if(motion == "openDepth"){
					$nowFocus
					.parent().addClass('active').end()
				 	.next().children().first().find("a").focus();
				}
				//자식메뉴 닫기
				else if(motion == "closeDepth"){
					$nowFocus
					.parent().parent().parent()
					.removeClass('active')
					.children('a').focus();
				}
				//열린 자식메뉴 모두 닫기
				else if (motion == "closeAllDepth"){
					$nowFocus
					.parent().parent().parent()
					.removeClass('active')
					.parent().parent()
					.removeClass('active')
					.children('a').focus();
				}
		}



	/*
	* 2018.09.11 ADD BY 원은재
	* [specialMain.jsp] lnb 2단 메뉴의 키보드 이벤트에서 사용되는 모션 핸들러
	* 3단 중첩 메뉴 내 포커스의 이동 && 하위메뉴 열고 접는 기능
	*
	* @param {object} e event객체.
	* @param {string} motion 모션의 이름.
	* @param {string} type lnb 타입의 이름 :2뎁스 정리 여부에 따른 상하 키 적용시 사용 됨 & 추후 개발.
	* ㄴwac-basic : 헤더 타이틀있는 1뎁스 기본 (하이마트) 타입
	* ㄴwac-none-tit : 헤더 타이틀없는 2뎁스 메뉴 타입
	*/
		var lnbMenuMotionHandler = function(e, motion, lnbType){
			_wac.preventDefaultAction(e);
			var $nowFocus = $(e.target),
					$nextItems;
				//이전 요소로 초점 이동
				if(motion == "beforeFocus"){
					$nowFocus.parent().prev().children('a').focus();
				}
				//다음 요소로 초점 이동
				else if(motion == "nextFocus"){
						$nowFocus.parent().next().children('a').focus();
					// }
				}
				//자식메뉴 열기
				else if(motion == "openDepth"){
					$nowFocus
					.parent().addClass('on').end()
				 	.next().find('.depth3-link').first().focus();
				}
				//자식메뉴 닫기
				else if(motion == "closeDepth"){
					$nowFocus
					.parents('.on')
					.removeClass('on')
					.children('a').focus();
				}
		}



	/*  
	*2018.08.23 ADD BY 원은재
	* 탭형 UI에 추가하게되는 접근성 모션 핸들러
	* 3단 중첩 메뉴 내 포커스의 이동 && 하위메뉴 열고 접는 기능
	*
	* @param {object} e event객체.
	* @param {object} $tabWrap 접근성 적용할 탭 엘리먼트 객체.
	* @param  {object} $prevEl 탭 영역을 진입 이전의 컨텐츠 요소.
	* @param  {object} $nextEl 탭 영역을 벗어나 진행될 다음 컨텐츠 요소.
	* @param  {boolean} isSlideCont 탭 컨텐츠 요소가 슬라이드형인지 판별 : 기본 false.
	*/
		var lottemartWacTabHandler = function(e, $tabWrap, $prevEl, $nextEl, isSlideCont){
			//console.log($tabWrap)
			/*[탭메뉴 객체 내 전역변수 선언]*/
			var $this, $activeTabNav, $activeTabCont, $tabContProd, contAreaId,// 활성 요소 판별 변수 선언
					$tabWrap = $tabWrap, // 0. 탭 그룹
					$tabNav = _wac.getFocusables($tabWrap.find('.wac-tabnav')), // 1.탭 내비게이션
					$tabContWrap = $tabWrap.find('.wac-tabcont'), // 2-1.탭 컨텐츠 포괄영역
					$tabCont = _wac.getFocusables($tabContWrap), // 2-2.탭 컨텐츠
					$prevEl = _wac.getFocusables($prevEl), // 이전영역 요소 할당
					$nextEl = _wac.getFocusables($nextEl), // 다음영역 요소 할당
					isSlideCont = !isEmpty(isSlideCont)
											? isSlideCont
											:undefined; // 3.탭컨텐츠가 슬라이드형인지 여부 (전문관 탭 + 슬라이드 혼재형 ui)

			/*[키보드 핸들러 선언부]*/
			// 1.탭 내비게이션 키보드 핸들러
			var tabNavKeyboardHandler = function(e){
				$this = $(this);
				//1. 탭키
				if(_wac.isTabEvent(e)){
					//1-1. 엔터직후의 탭키 이벤트일경우
					if(_wac.isWacEntered($this)){
						_wac.preventDefaultAction(e);
						$activeTabCont =_wac.getFocusables($tabContWrap.find('.active')).not($('.disabled'));
						$tabContProd = $tabContWrap.find('.active article.product-article'); //탭 컨텐츠 내 상품리스트가 존재할 경우, 상품 article
						//console.log($tabContProd);
						if(!_wac.isEmpty($activeTabCont)){
							_wac.preventDefaultAction(e);
							if(!_wac.isEmpty($tabContProd)){
								$tabContProd.first().addClass('hover');
							}
							_wac.onNextAsync(e, $activeTabCont[0]);
							return false;
						}
					//1-2. 기본적 탭키 이벤트일경우
					}else if(!(_wac.isWacEntered($this))){ 
						if($this.is($tabNav.last()) && !_wac.isEmpty($nextEl)){
							_wac.preventDefaultAction(e);
							_wac.onNextAsync(e, $nextEl[0]);
						}
					}
				}else if(_wac.isEnterEvent(e) && !_wac.isWacEntered($this)){
					_wac.markWacEnteredAsync($this);
				}else if(_wac.isShiftTabEvent(e) && $this.is($tabNav.first()) && !_wac.isEmpty($prevEl)){
					_wac.onNextAsync(e, $prevEl.last());
				}

			}
			// 2-2.탭 컨텐츠 키보드 핸들러
			var tabContKeyboardHandler = function(e){
					 $this = $(this);
					 $activeTabNav = $tabWrap.find('.wac-tabnav .active'); //현재 활성화된 탭 내비
					 $activeTabCont =_wac.visibleFocusables($tabWrap.find('.wac-tabcont .active'));//현재 활성화된 탭 컨텐츠 요소들
					 if(_wac.isShiftTabEvent(e)  && $this.is($activeTabCont[0])){
						 	_wac.preventDefaultAction(e);
						 	_wac.onNextAsync(e, $activeTabNav);
						}else if(_wac.isTabEvent(e) && $this.is($activeTabCont.last())){
						 	_wac.preventDefaultAction(e);
	 						_wac.onNextAsync(e, $activeTabNav);
							 // if($tabNav.last().hasClass('active') && !_wac.isEmpty($nextEl)){
							 // 	_wac.preventDefaultAction(e);
							 // 	_wac.onNextAsync(e, $nextEl[0]);
							 // }
						}
				}

			// 3.탭을 벗어나 촛점을 받을 이전 영역
			var prevElKeyboardHandler = function(e){
				$this = $(this);
				if(_wac.isTabEvent(e) && !_wac.isWacEntered($this)){
						_wac.preventDefaultAction(e);
						_wac.onNextAsync(e, $tabNav.first());
				}
			}

			// 4.탭을 벗어나 촛점을 받을 다음 영역
			var nextElKeyboardHandler = function(e){
				$this = $(this);
				if(_wac.isShiftTabEvent(e)){
					_wac.preventDefaultAction(e);
					_wac.onNextAsync(e, $tabNav.last());
				}
			}

			/*[포커스 핸들러 선언부]*/
			// 1.탭 내비게이션 포커스 핸들러
			var tabNavFocusoutHandler = function(e){
				$this = $(this);
				_wac.removeWacEnteredAsync($this);
			}
			// 2-1.탭 컨텐츠 포괄 영역 포커스인 핸들러 : 액티브된 영역의 컨텐츠에 이벤트 바인딩
			var tabContWrapFocusinHandler = function(e){
				$tabCont = _wac.getFocusables($tabContWrap); // 2.탭 컨텐츠
				if(!isSlideCont){
					_wac.wireUpEventAsync($tabCont, 'keydown', tabContKeyboardHandler);
				}
			}
			// 3.현재선택된 탭에 title="현재선택" 속성 추가 핸들러
			var attrTitleController = function(e){
				$this = $(this);
				contAreaId = $this.attr("href");
				$tabContWrap.children('.active').removeClass('active');
				$(contAreaId).addClass('active');

	 			$this.siblings().removeAttr("title").removeClass('active');
	 			$this.attr({
                      title : "현재선택",
                      class : "active"
	 			 });
	 		};

			/*[이벤팅 바인딩 시작]*/
			// 0.최초 1회 현재선택 된 탭에 타이틀 추가
			$tabNav.filter('.active').attr({
					title : "현재선택"
			});
			// 1.탭 내비게이션 바인딩
			$tabNav.on({
				click : attrTitleController,
				keydown : tabNavKeyboardHandler,
				focusout : tabNavFocusoutHandler
			});
			// 2.탭 컨텐츠 포괄 영역
			$tabContWrap.on({
				focusin : tabContWrapFocusinHandler
			});

			if(!_wac.isEmpty($prevEl)){
				// 3.탭을 벗어나 촛점을 받을 이전 영역
				wireUpEventAsync($prevEl.last(), 'keydown', prevElKeyboardHandler);
			}
			if(!_wac.isEmpty($nextEl)){
				// 4.탭을 벗어나 촛점을 받을 다음 영역
				wireUpEventAsync($nextEl.first(), 'keydown', nextElKeyboardHandler);
			}
		};



		/*  2018.09.06 ADD BY 원은재
		 * 라디오 버튼형 UI에 추가하게되는 접근성 모션 핸들러
		 * 초점 이동에 따른 자동 상태값 변환 제어
		 * 원하는 옵션 위에서 엔터를 칠 때에만 해당 이벤트가 발생되도록 함

		 * @param {object} e event객체.
		 * @param {object} $radioWrap 접근성 적용할 라디오 버튼 그룹 객체.
		 * @param  {object | function} $triggerFunc 라디오 버튼위에서 엔터를 칠 경우 실행할 엘리먼트 객체.
		 * @param  {object} $NextEl 라디오 버튼 영역을 벗어나 진행될 다음 컨텐츠 요소.
		 */
		var lottemartWacRadioBtnHandler = function(e, $radioWrap, triggerFunc, $NextEl){
			 	/*[라디오버튼 객체 내 전역변수 선언]*/
				var $this, $activeTabNav, $activeTabCont, // 활성 요소 판별 변수 선언
	 					$radioWrap = $radioWrap, // 0.라디오 버튼 그룹
	 					$radioInputs = _wac.getFocusables($radioWrap), // 1.라디오 버튼내 input 요소들
						triggerFunc = triggerFunc, // 2.$radioInps 위에서 엔터시 실행할 함수
	 					$NextEl = _wac.getFocusables($NextEl); // 3.라디오 버튼 영역을 벗어나 진행될 다음 컨텐츠 요소
						// console.log($radioInputs)

				/*[마우스 핸들러]*/
				 var radioBtnMouseHandler = function(e){
					 //좌측 마우스 클릭시 : 실행함수
					 if(e.which == 1) {
						 setTimeout(function(){
							 triggerFunc();
						  },0);
					 }
				 };

				 /*[키보드 핸들러]*/
				 var  radioBtnKeydownHandler = function(e){
						 //엔터를 눌렀을 경우 : 폼 전송 함수 호출
						 if(_wac.isEnterEvent(e)){
							triggerFunc();
						 }
						 //상, 하, 좌, 우측방향키를 눌렀을 경우
						 else if(_wac.isLeftArrowEvent(e) || _wac.isRightArrowEvent(e) || _wac.isUpArrowEvent(e) || _wac.isDownArrowEvent(e)){
							 _wac.preventDefaultAction(e);
						 }
						 else if(_wac.isTabEvent(e) && !_wac.isEmpty($NextEl)){
								_wac.onNextAsync($NextEl)
						 }
				 };


				 /*[이벤팅 바인딩 시작]*/
				 $radioInputs.on({
					 mouseup :  radioBtnMouseHandler,
					 keyup :  radioBtnKeydownHandler,
				 });

				 return $radioInputs;
			 };



		/*  2018.12.03 ADD BY 원은재
		 * 비ajax 처리되어있는 탭에서 발생되는 리프레시 대용용 접근성 초점 핸들러
		 * 탭 선택 후 페이지 리프레쉬될 때 초점이 유실되기 때문에 세션스토리지를 이용하여 
		 * 새로 로드된 페이지에서 현재 선택한 탭부터 초점이 시작 되도록 함.
		 * 

		 * @param {object} e event객체.
		 * @param {object} $tabNav 접근성 적용할 탭 내비게이션 각 링크 객체.
		 * @param {object} tabNavAttrStr 각 링크에서 가져올 구분용 어트리뷰트 문자열.
		 *
		 */ 
		var lottemartWacRemainFocusHandler = function(e, $tabNav, tabNavAttrStr ){
			var $tabNav = $tabNav,
				tabNavAttrStr = tabNavAttrStr,
				tabNavAttr;

			if( sessionStorage.isTabEntered == 'true'){
				$tabNav.filter('['+tabNavAttrStr+'="'+sessionStorage.tabNavAttr+'"]').focus();
				sessionStorage.isTabEntered = false;
			}
			$tabNav.on('keydown', function(e){
				if(_wac.isEnterEvent(e)){
					tabNavAttr = $(this).attr(tabNavAttrStr);
					sessionStorage.isTabEntered = true;
					sessionStorage.tabNavAttr = tabNavAttr;
				}
				
			});
		}

		
		
		/*  2018.12.06 ADD BY 원은재
		 * 비ajax 처리되어있는 소팅 그룹에서 발생되는 리프레시 대용용 접근성 초점 핸들러
		 * 탭 선택 후 페이지 리프레쉬될 때 초점이 유실되기 때문에 세션스토리지를 이용하여 
		 * 새로 로드된 페이지에서 현재 선택한 탭부터 초점이 시작 되도록 함.
		 * 

		 * @param {object} e event객체.
		 * @param {object} $sortingInput 접근성 적용할 각 소팅 인풋 객체.
		 * @param {object} inputAttrStr 각 링크에서 가져올 구분용 어트리뷰트 문자열.
		 *
		 */ 
		var lottemartWacRemainSortingFocusHandler = function(e, $sortingInput, inputAttrStr ){
			var $sortingInput = $sortingInput,
				inputAttrStr = inputAttrStr,
				sortingInputAttr;
			// console.log( sessionStorage.isSortingEntered)
			if( sessionStorage.isSortingEntered == 'true'){
				$sortingInput.filter('['+inputAttrStr+'="'+sessionStorage.sortingInputAttr+'"]').focus();
				sessionStorage.isSortingEntered = false;
			}
			$sortingInput.on('keydown', function(e){
				if(_wac.isEnterEvent(e)){
					sortingInputAttr = $(this).attr(inputAttrStr);
					sessionStorage.isSortingEntered = true;
					sessionStorage.sortingInputAttr = sortingInputAttr;
				}
				
			});
		}
		


			 /* bxslide 리팩토링
			 *	181024 [웹접근성 : 원은재]
			 *	- 기존 함수에서 사용되는 방식의 촛점이동 순번이 전면개선됨
			 * 	- 롯데마트 전역에 걸쳐서 슬라이드 이동방식이 통일 개선되었으며 기존 함수에서 불필요한 코드가 많아 리팩토링
			 *  - 일부 적용된 각 페이지별 슬라이드에서 공통되는 내용을 모아 모듈화 작업 시작
			 *
			 *	@param {object} $bxSlideWrap : bx 슬라이드 Wrapper 요소
			 *	@param {object} $prevEl : 슬라이드 촛점 진입 이전 요소
			 *	@param {object} nextEl : 슬라이드 촛점 이동 다음 요소
			 */
			var lottemartWacBxSldier = function($bxSlideWrap, $prevEl, $nextEl){
				var $bxSlideWrap = $bxSlideWrap,
					$bxCont = $bxSlideWrap.find('.bx-viewport'), // 1.슬라이드 컨텐츠
					$bxPager = _wac.getFocusables($bxSlideWrap.find('.bx-pager')), // 2.슬라이드 페이저
					$bxArrow = _wac.getFocusables($bxSlideWrap.find('.bx-controls-direction')), // 3.슬라이드 화살표

					$prevEl = !isEmpty($prevEl)	// 4.슬라이드 초점 진입 이전요소
									? _wac.getFocusables($prevEl).last()
									:undefined,
					$nextEl = !isEmpty($nextEl)	// 5.슬라이드 초점 이동 다음요소
									?_wac.getFocusables($nextEl).first()
									:undefined,
					$nowFocus, $nowActiveCont; 	// 6.런타임에 사용되는 active 변수 선언

				
				$bxSlideWrap.append($bxCont); //bx슬라이드 로딩후 controls 가 첫 초점을 받을 수 있도록 viewport와 마크업위치 변경
				
				/*[이벤트 핸들러 선언]*/
				// 1. 컨텐츠 키보드 핸들러
				var bxContKeyboardHandler = function(e){
					$nowFocus = $(this);
					$nowActiveCont = _wac.getFocusables($bxCont.find('.prod-list[aria-hidden="false"]'));

					if(_wac.isTabEvent(e)){
						if($nowFocus.is($nowActiveCont.last())){
							_wac.preventDefaultAction(e);
							_wac.onNextAsync(e, $bxPager.filter('.active'));
						}
					}
				}

				// 2-1. 페이저 키보드 핸들러
				var bxPagerKeyboardHandler = function(e){
					$nowFocus = $(this),
					$nowActiveCont = _wac.getFocusables($bxCont.find('.prod-list[aria-hidden="false"]'));

					//탭키
				 if(_wac.isTabEvent(e)){
					 if(_wac.isWacEntered($nowFocus)){
			 			 	_wac.preventDefaultAction(e);
						 _wac.onNextAsync(e, $nowActiveCont.first());

					 }else if($nowFocus.is($bxPager.last()) && !isEmpty($nextEl)){
							_wac.preventDefaultAction(e);
							_wac.onNextAsync(e, $nextEl);
						}
					//엔터키
					}else if(_wac.isEnterEvent(e)){
						_wac.markWacEnteredAsync($nowFocus);
					}
				}

				// 2-2. 페이저 포커스아웃 핸들러
				var bxPagerFocusoutHandler = function(e){
					$nowFocus = $(this);
					_wac.removeWacEnteredAsync($nowFocus);
				}

				// 3. 화살표 키보드 핸들러
				var bxArrowKeyboardHandler = function(e){
					$nowFocus = $(this);
					//좌측 화살표
					if($nowFocus.is($bxArrow.first())){
						//역탭
						if(_wac.isShiftTabEvent(e)){
							_wac.preventDefaultAction(e);
							_wac.onNextAsync(e, $prevEl);
						}
					//우측 화살표
					}else if($nowFocus.is($bxArrow.last())){
						//탭
						if(_wac.isTabEvent(e)){
							_wac.preventDefaultAction(e);
							_wac.onNextAsync(e, $bxPager.filter('.active'));
						}
					}
				}

				// 4. 이전 초점 영역 키보드 핸들러
				var prevElKeyboardHandler = function(e){
					if(_wac.isTabEvent(e)){
						_wac.onNextAsync(e, $bxArrow.first());
					}
				}

				// 5. 다음 초점 영역 키보드 핸들러
				var nextElKeyboardHandler = function(e){
					if(_wac.isShiftTabEvent(e)){
						_wac.onNextAsync(e, $bxPager.last());
					}
				}


				/*[이벤트 바인딩 시작]*/
				// 1. 컨텐츠 바인딩
				$bxCont.on({
					keydown : bxContKeyboardHandler
				}, 'a, button, input')

				// 2. 페이저 바인딩
				if(!isEmpty($bxPager)){
					$bxPager.on({
						keydown : bxPagerKeyboardHandler,
						focusout : bxPagerFocusoutHandler
					})
				}

				// 3. 화살표 바인딩
				$bxArrow.on({
					keydown : bxArrowKeyboardHandler
				})

				//4. 이전 초점 영역 바인딩
				if(!isEmpty($prevEl)){
					$prevEl.on({
						keydown : prevElKeyboardHandler
					})
				}
				
				//5. 다음 초점 영역 바인딩
				if(!isEmpty($nextEl)){
					$nextEl.on({
						keydown : nextElKeyboardHandler
					})
				}	
		}
		
		

		/* dropdown 컴포넌트
		*  181030 [웹접근성 : 원은재]
		*  - 기존 ui.js 내의 드롭다운 컴포넌트가 파이어폭스에서 열리지 않음 & 접근성 미적용 상태
		*  - 기존 코드의 경량화 & 크로스브라우징 & 접근성 모듈 통합적용을 위하여 새 함수 개발
		*	
		*  @param {object} $dropdownWrap : dropdown Wrapper 요소
		*/
		
		var lottemartWacDropdown = function($dropdownWrap){
			var	$dropdownWrap = $dropdownWrap, //드롭다운 요소 Wrapper
				$dropTriggerBtn = $dropdownWrap.find('.drop-trigger-btn'), //드롭다운 trigger Btn
				$dropdownList = $dropTriggerBtn.next('.drop-list'), //드롭다운될 리스트의Wrapper
				$nowFocus;
			
			
			//드롭다운 버튼 기본 이벤트 핸들러 : 트리거 버튼에 여닫는 기능 추가
			$dropTriggerBtn.on('click', function(e){
				_wac.preventDefaultAction(e)
				if($dropdownWrap.hasClass('active')){
					$dropdownWrap.removeClass('active');
				}else{
					$('.wrap-drop-down').removeClass('active');
					$dropdownWrap.addClass('active');
				}
			});
			
			//전역 키보드 핸들러 : 드롭다운 컴포넌트 영역 외의 공간을 클릭시 닫히는 함수 추가 바인딩
			$(document).on('click', function(e){
				$dropdownWrap.removeClass('active');
			});
			
			//웹접근성 키보드 핸들러 : 드롭다운 컴포넌트 영역에서 초점이 벗어날 경우 닫히도록 추가 바인딩
			$dropdownWrap.on('keydown', 'a', function(e){
				$nowFocus = $(this);
				//1. 트리거 버튼 위에서 역탭 키 눌렀을 경우
				//2. 드롭다운 리스트 마지막 요소에서 탭 눌렀을 경우
				if((_wac.isShiftTabEvent(e) && $nowFocus.is($dropTriggerBtn)) || 
					(_wac.isTabEvent(e) && $nowFocus.is(_wac.getFocusables($dropdownList).last()))){
					$dropdownWrap.removeClass('active');
				}else if(_wac.isEscEvent(e)){
					_wac.preventDefaultAction(e);
					$dropdownWrap.removeClass('active');
					$dropTriggerBtn.focus();
				}
			})
		};
		
		// 181025 [웹접근성 : 원은재]
		/* 앞뒤 두 요소에 대하여 tab 과 shift+tab 키 이벤트 자동 바인딩
		*	@$prevEL : object
		*	@$nextEL : object
		*
		var interLinkEL = function($prevEL, $nextEL){
			var $prevEL = $prevEL, //이전 요소
					$nextEL = $nextEL; //다음 요소

			var prevELKeyboardHandler = function(e){
				if(_wac.isTabEvent(e)){
					_wac.onNextAsync(e, $nextEL);
				}
			}

			var nextELKeyboardHandler = function(e){
				if(_wac.isShiftTabEvent(e)){
					_wac.onNextAsync(e, $prevEL);
				}
			}
			$prevEL.on({
				keydown : prevELKeyboardHandler
			});
			$nextEL.on({
				keydown : nextELKeyboardHandler
			});
		}
		*/
	return {
		isEmpty: isEmpty,
		getFocusables: getFocusables,
		visibleFocusables : visibleFocusables,
		getFocusableInfo: getFocusableInfo,
		getNextFocusable: getNextFocusable,
		getEventhandlerArr: getEventhandlerArr,
		preventDefaultAction: preventDefaultAction,

		wireUpEventAsync: wireUpEventAsync,
		//wireUpHoverToFocus: wireUpHoverToFocus,
		//setAriaLive: setAriaLive,

		isTabEvent: isTabEvent,
		isEnterEvent: isEnterEvent,
		isShiftTabEvent: isShiftTabEvent,
		isEscEvent:isEscEvent,
		isRightArrowEvent:isRightArrowEvent,
		isUpArrowEvent:isUpArrowEvent,
		isLeftArrowEvent:isLeftArrowEvent,
		isDownArrowEvent:isDownArrowEvent,

		isEventBound: isEventBound,

		isWacEntered: isWacEntered,
		markWacEnteredAsync: markWacEnteredAsync,
		removeWacEnteredAsync: removeWacEnteredAsync,

		onNextAsync: onNextAsync,
		//interLinkEL: interLinkEL,

		bx: bx,
		slick: slick,

		//basketTabHandler: basketTabHandler,

		gnbMenuMotionHandler : gnbMenuMotionHandler,
		lnbMenuMotionHandler : lnbMenuMotionHandler,
		lottemartWacTabHandler : lottemartWacTabHandler,
		lottemartWacRadioBtnHandler : lottemartWacRadioBtnHandler,
		lottemartWacRemainFocusHandler : lottemartWacRemainFocusHandler,
		lottemartWacRemainSortingFocusHandler : lottemartWacRemainSortingFocusHandler,

		lottemartWacDropdown : lottemartWacDropdown,
		lottemartWacBxSldier : lottemartWacBxSldier

	};
}));
