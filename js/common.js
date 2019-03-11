$(document).ready(function(){
    
    //h1 모션
    $('.gnb h1 a').hover(function(){
        $( this ).css('text-decoration','underline');
    }, function(){
        $( this ).css('text-decoration','');
    });

    $('[data-toggle="tooltip"]').tooltip();


    var num = 0, $nowActiveEL, $textOfEL;
    var log = function(){
        num  = num + 1;
        $nowActiveEL = $(document.activeElement);
        $textOfEL = $nowActiveEL.text();
        console.log($nowActiveEL,num,$textOfEL);
        return num;
    }
    var focusinHandler = function(){
        $nowActiveEL = $(document.activeElement);
        // $nowActiveEL.css({
        //     'outline-offset' : '-5px;',
        //     'outline' : '1px solid red'
        // });
        $nowActiveEL.attr('style', 'outline:1px solid red; outline-offset:-1px;')
        log ();
    }
    var focusoutHandler = function(){
        $(this).css('outline', 'none').css('outline-offset', '0');
    }

    $(document).on({focusin : focusinHandler});
    $(document).on({focusout : focusoutHandler}, 'a:visible, button:visible, :input:not(:hidden), [tabindex], [href]');
});


