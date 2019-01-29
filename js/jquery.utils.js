(function( factory ) {
	'use strict';
	
	if( typeof define === 'function' && define.amd ) {
		define( ['jquery'], factory );
	} else if( typeof exports !== 'undefined' ) {
		module.exports = factory( require( 'jquery' ) );
	} else {
		factory( jQuery );
	}
} (function( $ ) {
	'use strict';
	
	var defaults = {
		'useLog': {'editable': false, 'value': true },
		'androidAppVersion' : { 'editable' : false, 'value' : '10.74' },
		'iosAppVersion' : { 'editable' : false, 'value' : '9.9.4' },
		'mobileMapPath' : { 'editable' : false, 'value' : '/mobile/popup/storeView.do' },
		'lottemartSchemeUrl' : { 'editable' : false, 'value' : 'lottemartmall://' },
		'imageCdnPath' : { 'editable' : false, 'value' : 'http://image.lottemart.com' },
		'sImageCdnPath' : { 'editable' : false, 'value' : '//simage.lottemart.com' },
		'popupDeliveryTimeUrl' :{ 'editable' : false, 'value' : '/quickmenu/popup/deliverytime.do?SITELOC=AE001' },
		'popupMyDeliveryUrl' :{ 'editable' : false, 'value' : '/mymart/popup/selectMyDeliveryList.do?SITELOC=AE002' },
		'facebookAppId' : { 'editable' : false, 'value' : '739454589522567' },
		'schemePushList' : { 'editable' : false, 'value' : 'lottemartapp://pushList?url='},
		'schemeShowBar' : { 'editable' : false, 'value' : 'lottemartapp://showBar' },
		'schemeHideBar' : { 'editable' : false, 'value' : 'lottemartapp://hideBar' },
		'schemeCloseIntro' : { 'editable' : false, 'value' : 'lottemartmall://closeIntro' },
		'schemeBasketcountupdate' : { 'editable' : false, 'value' : 'lottemartmall://basketcountupdate' },
		'appMarketAndroid' : { 'editable' : false, 'value' : 'https://play.google.com/store/apps/details?id=com.lottemart.shopping' },
		'appMarketIOS' : { 'editable' : false, 'value' : 'http://itunes.apple.com/app/id493616309' }
	};
	
	var regExps = {
		comma : /\B(?=(\d{3})+(?!\d))/g
	};
	
	$.utils = {
		/*
		 * key event로 넘어온 값이 숫자인지 체크 합니다.
		 * input number로 최신 브라우저는 체크 하고, 하위버전의 경우 css ime-mode:disabled;를 이용하여 한글을 걸러냅니다.
		 * $('input[data-type="number"]').on('keydown', $.utils.keyIsNumber);
		 * */
		keyIsNumber : function(e) {
			var keyCode = e.keyCode || e.which;
			
			if( !(
				keyCode == 8								// backspace
				|| keyCode == 9							// tab 
				|| keyCode == 46							// delete
				|| (keyCode >= 35 && keyCode <= 40)		// arrow keys/home/end
				|| (keyCode >= 48 && keyCode <= 57)		// numbers on keyboard
				|| (keyCode >= 96 && keyCode <= 105)	// number on keypad
			) ) {
				e.preventDefault();
			}
		},
		
		calculateTotalByte : function(value) {
			var totalByte = 0;
			for(var i = 0; i < value.length; i++) {
				var _byte = $.utils.getByte(value.charAt(i));
				
				totalByte += _byte;
			}
			
			return totalByte;
		},
		
		getExceedCharacterIndex : function(value, maxByte) {
			var totalByte = 0;
			for(var i = 0; i < value.length; i++) {
				var _byte = $.utils.getByte(value.charAt(i));
				if(totalByte >= maxByte) {
					if(_byte > 1) {
						return i -1;
					}
					
					return i;
				}
				
				totalByte += _byte;
			}
			
			return value.length;
		},
		
		getByte : function(char, previousChar) {
			if(escape(char).length > 1) {
				return escape(char).length / 2;
			} else if (char == '\n' && previousChar != '\r') {
				return 1;
			} else if (char == '<' || char == '>') {
				return 4;
			} 
			
			return 1;
		},
		
		/*
		 * */
		parseBoolean : function(str) {
			if( typeof str != 'boolean' ) {
				str = ( str.toLowerCase() == 'true' ) ? true : false;
			}
			return str;
		},
		visible : function($obj){
			$obj.css('visibility', 'visible');
		},
		config : function( n, v ) {
			if($.type(n) === 'object') {
                setObj(n);
            } else if($.type(n) === 'string' && arguments.length == 2) {
                setStr(n, v);
            } else if($.type(n) === 'string' && arguments.length == 1) {
                return get(n);
            } else if(arguments.length == 0) {
                return getProperty();
            } else {
                $.utils.error('parameter is only json or string. current type : ' + $.type(n));
            }

            function setObj(obj) {
                $.each(obj, function(n) {

                    if(defaults[n] && defaults[n].editable) {
                        if(typeof obj[n] === 'string' && (obj[n] === 'True' || obj[n] === 'False')) {
                            obj[n] = obj[n] == 'True';
                        }

                        defaults[n].value = obj[n] || defaults[n].value;
                        defaults[n].editable = false;
                    } else {
                    	defaults[n] = {
                    		value : obj[ n ],
                    		editable : false
                    	};
                    }
                });
            }

            function setStr(n, v) {
                if(defaults[n] && defaults[n].editable) {
                    if(typeof v === 'string' && (v === 'True' || v === 'False')) {
                        v == true;
                    }

                    defaults[n].value = v;
                    defaults[n].editable = false;
                } else if( defaults[n] === undefined ) {
                	defaults[n] = {
                		value : v,
                		editable : false
                	};
                } else {
                    $.utils.error('name is not editabled : ' + n );
                }
            }

            function get(n) {            	//
//                if(defaults[n] === undefined && n !== 'all') {
//                    $.utils.error('undefined property name : ' + n);
//                }

                var returnVal;

                if(n == 'all') {
                    returnVal = {};
                    for(var item in defaults) {
                        returnVal[item] = defaults[item].value;
                    }
                } else {
                    if( defaults[n] !== undefined ) {
                        returnVal = defaults[n].value;
                    }
                }
                return returnVal;
            }

            function getProperty() {
                return {
                    appSettingUrl: function() {
                        return utils.config('appSettingUrl');
                    }
                };
            }

            return this;
		},
		log : function( obj ) {
			var useLog = this.config('useLog') == true && window.console;
            if(useLog) {
                if(typeof obj == "object" && console.dir) {
                    console.dir && console.dir(obj);
                } else {
                    console.log && console.log(obj);
                }
            }
		},
		error : function( obj ) {
			var useLog = this.config('useLog') == true && window.console;
			if(useLog) {
				var errorName = obj.split( ':' )[ 0 ],
					value = obj.split( ':' )[ 1 ];
				
				console.log('%c ' + errorName + ' : ' + '%c' + value, 'color: #bada55', 'color: #FF5A5A');
			}
		},
		isMobile : function() {
            var rtn = false;

            if(navigator.userAgent.match(/Android|Mobile|iP(hone|od|ad)|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/)) {
                rtn = true;
            }

            return rtn;
        },
        isIOS : function() {
        	var rtn = false;

            if(navigator.userAgent.match(/iP(hone|od|ad)/)) {
                rtn = true;
            }

            return rtn;
        },
        isAndroid : function() {
        	var rtn = false;
        	
        	if( navigator.userAgent.match( /Android|android/ ) ) {
        		rtn = true;
        	}
        	
        	return rtn;
        },
		isiOSLotteMartApp : function () {
			var ua= window.navigator.userAgent;

			return ua.toUpperCase().indexOf("LOTTEMART-APP-SHOPPING-IOS") > -1;
        },
		isAndroidLotteMartApp : function () {
			var ua= window.navigator.userAgent;

			return ua.toUpperCase().indexOf("LOTTEMART-APP-SHOPPING-ANDROID") > -1 || ua.toUpperCase().indexOf("LOTTEMART-APP-SHOPPING-DID") > -1;
        },
        isIE : function() {
        	var rtn = false;
        	
        	if( navigator.userAgent.match( 'MSIE' ) ) {
        		rtn = true;
        	}
        	
        	return rtn;
        },
        getParamFoWiseLog : function( str ) {
        	if( str === undefined || str === '' ) {
        		return '';
        	}
        	var codeList = ["dpId", "itemSetId", "scnId"],
				clickParams = str.substring( str.indexOf( "?" ) + 1 ).split( "&" ),
				curParams ,
				params = '';
        	
			for ( var i = 0, len = codeList.length; i < len; i++ ) {
				curParams = $.grep( clickParams, function( obj ) {
					return obj.indexOf( codeList[i] + "=" ) >= 0;
				});
				if ( curParams != null && curParams.length > 0 ) {
					if ( codeList[i] === "dpId" ) {
						params += ( "&" + "dp=" + curParams[0].split("=")[1] );
					}
					else {
						params += ( "&" + curParams[0] );
					}
				}
			}
			
			return params;
        },
        setMetaTag : function( obj ) {//google, facebook, twitter
        	var metas = '';
        	
        	$.each( obj, function( name , value ) {
    			var $meta = $( 'meta[name="' + name + '"]' );
        		
        		if( $meta.length === 0 ) {
        			var isOgTag = name.indexOf( 'og' ) !== -1,
        				isTwitter = name.indexOf( 'twitter' ) !== -1;
        		
	        		if( isOgTag ) {
	        			metas = metas + '<meta property="' + name + '" content="' + value + '">';
	        		} else if( isTwitter ) {
	        			metas = metas + '<meta name="' + name + '" content="' + value + '">';
	        		} else {
	        			if( name.indexOf( 'fb') !== -1 || name.indexOf( 'article' ) ) {
	        				metas = metas + '<meta property="' + name + '" content="' + value + '">';
	         			} else {
	        				metas = metas + '<meta itemprop="' + name + '" content="' + value + '">';
	        			}
	        		}
        		} else {
        			$meta.attr( 'content', value );
        		}
        		
        	});
        	
        	$( 'head' ).append( metas );
        },
        unloadForLoading : function() {
    		if( $.fn.loadingBar && navigator.userAgent.indexOf( 'lottemartapp' ) === -1 ) {
    			$( 'body' ).loadingBar();
    		}
        },
        comma : function( str ) {
        	return str.toString().replace( regExps.comma, ",");
        },
		getParams : function() {
			/*
			 * @return $.utils.getParams()['params'] || $.utils.getParams()
			 * */
			function urldecode(str) {
				return decodeURIComponent((str+'').replace(/\+/g, '%20'));
			}

			function transformToAssocArray( prmstr ) {
				var params = {},
					prmarr = prmstr.split("&");
				
				for ( var i = 0; i < prmarr.length; i++) {
					var tmparr = prmarr[i].split("=");
						params[tmparr[0]] = urldecode(tmparr[1]);
				}
				return params;
			}
			
			var prmstr = window.location.search.substr(1);
			
			return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
		},
		checkAppVersion : function( str,  lastestAppVersion ) {//row app version check
			lastestAppVersion = lastestAppVersion || ( $.utils.isIOS() ? $.utils.config( 'iosAppVersion' ) : $.utils.config( 'androidAppVersion' ) );
				
			var lastestAppVersionArray = lastestAppVersion.split( '.' ),
        		currentAppVersionArray = str.split( '.' ),
        		returnValue = true;
        	
        	lastestAppVersionArray.some( function( v, i ) {
        		if( parseInt( currentAppVersionArray[ i ], 10 ) < parseInt( v, 10 ) ) {
        			returnValue = false;
        		}
        		
        		return !returnValue;
        	});
        	
        	return returnValue;
		},
		getAppVersion : function () {
            return navigator.userAgent.split('app-version')[1].replace('V.', '').replace(/\s/gi, '');
        },
        serializeObject : function($form) {
        	try {
    			var serializeArray = $form.serializeArray()
    			  , obj = {};
    			
    			if(serializeArray) {
    				$.each(serializeArray, function() {
    					obj[this.name] = this.value;
    				});
    			}
    			
    			return obj;
    		} catch(e) {
    			return null;
    		}
        },
        checkedAll : function($checkboxes) {
    		this.setCheckedAll($checkboxes, true);
    	},
    	unCheckedAll : function($checkboxes) {
    		this.setCheckedAll($checkboxes, false);
    	},
    	setCheckedAll : function($checkboxes, isChecked) {
    		$checkboxes.each(function() {
    			$(this).prop('checked', isChecked);
    		});
    	},
    	concatCheckedValues : function($checkboxes, delimeter) {
    		var values = '';
			
			$checkboxes.each(function() {
				if(this.checked) {
					var _delimeter = delimeter || values == '' ? '' : ',';

					values += _delimeter + this.value;
				}
			});
			
			return values;
    	},
    	
    	concatCheckedId : function($checkboxes, delimeter) {
    		var id = '';
			
			$checkboxes.each(function() {
				if(this.checked) {
					var _delimeter = delimeter || id == '' ? '' : ',';

					id += _delimeter + this.id;
				}
			});
			
			return id;
    	},
    	
    	checkedSelectedValues : function($checkboxes, selectedValues) {
			$.each(selectedValues, function(i, v) {
				$checkboxes.filter('[value="' + v + '"]').prop('checked', true);
			});
    	},
    	
		setActiveCheckedFieldWrapper : function($el, $wrapper) {
			if(!$wrapper.hasClass('active') && $el.is(':checked')) {
				$wrapper.addClass('active');
			} else {
				$wrapper.removeClass('active');
			}
		},

		deferredAction: function() {
			var args = arguments;
			var isAllFunctions = function(arr) {
				var isFlag = true;
				
				isFlag
					&& $.each(arr, function(i, v){
						isFlag = (isFlag && $.isFunction(v));
					});
				return isFlag;
			};

			return (args && args.length)
				? (function(args) {
					var funcArr = $.makeArray(args),
						$deferred = undefined,
						deferredArr = undefined;

					if (!isAllFunctions(funcArr)) {
						console.error('arguments can be accepted only functions.');
						$deferred = $.Deferred();
						$deferred.resolve();

						return $deferred;
					} else {
						deferredArr = $.map(funcArr, function(v, i){
							$deferred = $.Deferred();
							$deferred.resolve(v());

							return $deferred;
						});

						return $.when.apply($, deferredArr)
					}
				})(args)
				: (function() {
					var $deferred = $.Deferred();

					$deferred.resolve(undefined);
					return $deferred.promise();
				})();
		},

		deferredArrAction: function(deferredArr) {
			return $.isArray(deferredArr)
				? (function() {
					var $deferred = $.Deferred();

					$.when.apply($, deferredArr)
						.done(function() {
							$deferred.resolve([].slice.call(arguments));
						}).fail(function() {
							$deferred.reject([].slice.call(arguments));
						});

					return $deferred.promise();
				})()
				: (function() {
					var $deferred = $.Deferred();

					console.log('argument can be accepted only array of $.Deferred.');
					$deferred.resolve(undefined);
					return $deferred.promise();
				})();
		},
		
		//email Domain input disabled status setting
		setDisabledEmailDomainInput : function(val, $inputEmailDomain) {
			if(val == '직접입력') {
				$inputEmailDomain.removeAttr('disabled');
			} else {
				$inputEmailDomain.val('');
				$inputEmailDomain.attr('disabled', 'disabled');
			}
		},
		
		concatEmailInput : function($emailId, $inputEmailDomain, $selectEmailDomain) {
			var emailDomain;
			
			if($selectEmailDomain.val() == '직접입력') {
				emailDomain = $inputEmailDomain.val().trim();
			} else {
				emailDomain = $selectEmailDomain.val();
			}
			
			return $emailId.val() + '@' + emailDomain; 
		},
		
		removeCharacters : function(str) {
			return str.replace(/[^0-9]/g, '');
		}
	};
}));