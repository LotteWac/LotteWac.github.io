$(document).ready(function(){
    
    //h1 모션
    $('.gnb h1 a').hover(function(){
        $( this ).css('text-decoration','underline');
    }, function(){
        $( this ).css('text-decoration','');
    });

    $('[data-toggle="tooltip"]').tooltip();
});


