$(document).ready(function(){
    
    //h1 모션
    $('.gnb h1 a').hover(function(){
        $( this ).text('접근성 가이드');
    }, function(){
        $( this ).text('Accessibility Guide');
    });

});