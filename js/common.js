$(document).ready(function(){

    var $mBtn = $('.gnb .menu-btn'),
        $pannel = $('.gnb .device'),
        $container = $('.container');

    var mobileMenuBtnMotionHandler = function(e){
        if(!$pannel.hasClass('active')){
          $pannel.addClass('active');
          $container.addClass('gnb-active')
        }else{
          $pannel.removeClass('active');
          $container.removeClass('gnb-active')
        }
    };

   $mBtn.on({
     click : mobileMenuBtnMotionHandler
   });


    // var num = 0, $nowActiveEL, $textOfEL;
    // var log = function(){
    //     num  = num + 1;
    //     $nowActiveEL = $(document.activeElement);
    //     $textOfEL = $nowActiveEL.text();
    //     console.log($nowActiveEL,num,$textOfEL);
    //     return num;
    // }
    // var focusinHandler = function(){
    //     $nowActiveEL = $(document.activeElement);
    //     // $nowActiveEL.css({
    //     //     'outline-offset' : '-5px;',
    //     //     'outline' : '1px solid red'
    //     // });
    //     $nowActiveEL.attr('style', 'outline:1px solid red; outline-offset:-1px;')
    //     log ();
    // }
    // var focusoutHandler = function(){
    //     $(this).css('outline', 'none').css('outline-offset', '0');
    // }

    // $(document).on({focusin : focusinHandler});
    // $(document).on({focusout : focusoutHandler}, 'a:visible, button:visible, :input:not(:hidden), [tabindex], [href]');
});
