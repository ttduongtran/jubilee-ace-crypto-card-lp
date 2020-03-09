/* Add Magic Line markup via JavaScript, because it ain't gonna work without */
$(function () {
  const mdScreen = 768;

  $(".menu").each(function (index, menu) {
    const $menu = $(menu);
    $menu.append("<li id='magic-line' class='d-none d-md-block'></li>");

    const $magicLine = $menu.find("#magic-line");
    const $activeMenu = $menu.find(".active a");
    let isHiding = $(window).width() < mdScreen;
    let paddingLeft = parseFloat($activeMenu.css('padding-left'));
    const _onEnter = function () {
      if ($(window).width() >= mdScreen) {
        const $el = $(this);
        paddingLeft = parseFloat($el.css('padding-left'));
        const leftPos = $el.position().left + paddingLeft;
        const newWidth = $el.parent().width() * 0.4;

        $magicLine.stop().animate({
          left: leftPos,
          width: newWidth
        });
      }
    };
    const _onLeave = function () {
      if ($(window).width() >= mdScreen) {
        paddingLeft = parseFloat($activeMenu.css('padding-left'));

        $magicLine.stop().animate({
          left: $activeMenu.position().left + paddingLeft,
          width: $activeMenu.width() * 0.4
        });
      }
    };

    $magicLine
      .width($activeMenu.width() * 0.4)
      .css("left", $activeMenu.position().left + paddingLeft);

    $menu.find(".nav-item a").hover(_onEnter, _onLeave);

    $(window).on('resize', function () {
      if ($(this).width() >= mdScreen) {
        if (isHiding) {
          isHiding = false;
          paddingLeft = parseFloat($activeMenu.css('padding-left'));

          $magicLine
            .width($activeMenu.width() * 0.4)
            .css("left", $activeMenu.position().left + paddingLeft);
        }
      } else {
        isHiding = true;
      }
    })
  })
});