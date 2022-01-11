import kijs, { Kijs, each } from "kijs";

const defaults = {
  topSpacing: <number>0,
  bottomSpacing: <number>0,
  className: <string>"is-sticky",
  wrapperClassName: <string>"sticky-wrapper",
  center: <boolean>false,
  getWidthFrom: <string>"",
  widthFromWrapper: <boolean>true, // works only when .getWidthFrom is empty
  responsiveWidth: <boolean>false,
  zIndex: <"inherit" | "initial" | "auto" | number>"auto",
};
type Options = typeof defaults;
const $window = kijs(window),
  $document = kijs(document),
  sticked = new Set<
    Options & {
      stickyElement: Kijs;
      stickyWrapper: Kijs;
      currentTop: number | void;
    }
  >();
let windowHeight = $window.height();

function scroller() : void {
  const scrollTop = $window.scrollTop(),
    documentHeight = $document.height(),
    dwh = documentHeight - windowHeight,
    extra = scrollTop > dwh ? dwh - scrollTop : 0;

  sticked.forEach((s) => {
    const elementTop = s.stickyWrapper.offset().top,
      etse = elementTop - s.topSpacing - extra;

    //update height in case of dynamic content
    s.stickyWrapper.css("height", s.stickyElement.outerHeight());

    if (scrollTop <= etse) {
      if (s.currentTop !== void 0) {
        s.stickyElement
          .css({
            width: "",
            position: "",
            top: "",
            "z-index": "",
          })
          .parent()
          .removeClass(s.className);
        s.stickyElement.trigger("sticky-end", [s]);
        s.currentTop = void 0;
      }
    } else {
      let newTop =
        documentHeight -
        s.stickyElement.outerHeight() -
        s.topSpacing -
        s.bottomSpacing -
        scrollTop -
        extra;
      if (newTop < 0) {
        newTop = newTop + s.topSpacing;
      } else {
        newTop = s.topSpacing;
      }
      if (s.currentTop !== newTop) {
        let newWidth;
        if (s.getWidthFrom) {
          newWidth = kijs(s.getWidthFrom).width() || void 0;
        } else if (s.widthFromWrapper) {
          newWidth = s.stickyWrapper.width();
        }
        if (newWidth === void 0) {
          newWidth = s.stickyElement.width();
        }
        s.stickyElement
          .css({
            width: newWidth,
            position: "fixed",
            top: newTop,
            "z-index": s.zIndex,
          })

          .parent()
          .addClass(s.className);

        if (s.currentTop === void 0) {
          s.stickyElement.trigger("sticky-start", [s]);
        } else {
          // sticky is started but it have to be repositioned
          s.stickyElement.trigger("sticky-update", [s]);
        }

        if (
          (s.currentTop === s.topSpacing && s.currentTop > newTop) ||
          (s.currentTop === void 0 && newTop < s.topSpacing)
        ) {
          // just reached bottom || just started to stick but bottom is already reached
          s.stickyElement.trigger("sticky-bottom-reached", [s]);
        } else if (
          s.currentTop !== void 0 &&
          newTop === s.topSpacing &&
          s.currentTop < newTop
        ) {
          // sticky is started && sticked at topSpacing && overflowing from top just finished
          s.stickyElement.trigger("sticky-bottom-unreached", [s]);
        }

        s.currentTop = newTop;
      }

      // Check if sticky has reached end of container and stop sticking
      const stickyWrapperContainer = s.stickyWrapper.parent();
      const unstick =
        s.stickyElement.offset().top + s.stickyElement.outerHeight() >=
          stickyWrapperContainer.offset().top +
            stickyWrapperContainer.outerHeight() &&
        s.stickyElement.offset().top <= s.topSpacing;

      if (unstick) {
        s.stickyElement
          .css("position", "absolute")
          .css("top", "")
          .css("bottom", 0)
          .css("z-index", "");
      } else {
        s.stickyElement
          .css("position", "fixed")
          .css("top", newTop)
          .css("bottom", "")
          .css("z-index", s.zIndex);
      }
    }
  });
}
function resizer() : void {
  windowHeight = $window.height();

  sticked.forEach((s) => {
    let newWidth;
    if (s.getWidthFrom) {
      if (s.responsiveWidth) {
        newWidth = kijs(s.getWidthFrom).width();
      }
    } else if (s.widthFromWrapper) {
      newWidth = s.stickyWrapper.width();
    }
    if (newWidth !== void 0) {
      s.stickyElement.css("width", newWidth);
    }
  });
}
function sticky<T = HTMLElement>(elems: ArrayLike<T>, options: Options): void {
  const o = extend({}, defaults, options);
  each(elems, (elem) => {
    const stickyElement = kijs(elem);

    const stickyId = stickyElement.attr("id");
    const wrapperId = stickyId
      ? stickyId + "-" + defaults.wrapperClassName
      : defaults.wrapperClassName;
    const wrapper = kijs("<div>")
      .attr("id", wrapperId)
      .addClass(o.wrapperClassName);

    stickyElement.wrapAll(wrapper);

    const stickyWrapper = stickyElement.parent();

    if (o.center) {
      stickyWrapper.css({
        width: stickyElement.outerWidth(),
        marginLeft: "auto",
        marginRight: "auto",
      });
    }

    if (stickyElement.css("float") === "right") {
      stickyElement.css({ float: "none" }).parent().css({ float: "right" });
    }

    o.stickyElement = stickyElement;
    o.stickyWrapper = stickyWrapper;
    o.currentTop = void 0;

    sticked.add(o);

    setWrapperHeight(elem);
    setupChangeListeners(elem);
  });
}

function setWrapperHeight<T = HTMLElement>(stickyElement: T): void {
  const element = kijs(stickyElement);
  element.parent().css("height", element.outerHeight());
}

function setupChangeListeners<T = HTMLElement>(stickyElement: T): void {
  if (typeof MutationObserver !== "undefined") {
    const mutationObserver = new MutationObserver((mutations) => {
      if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
        setWrapperHeight(stickyElement);
      }
    });
    mutationObserver.observe(stickyElement, {
      subtree: true,
      childList: true,
    });
  } else {
    stickyElement.addEventListener("DOMNodeInserted", () =>
      setWrapperHeight(stickyElement)
    );
    stickyElement.addEventListener("DOMNodeRemoved", () =>
      setWrapperHeight(stickyElement)
    );
  }
}

function unstick<T = HTMLElement>(elems: ArrayLike<T>): void {
  each(elems, (elem) => {
    let removed = false;
    sticked.forEach((s) => {
      if (s.stickyElement.get(0) === elem) {
        sticked.delete(s);
        removed = true;
      }
    });
    if (removed) {
      kijs(elem).unwrap().css({
        width: "",
        position: "",
        top: "",
        float: "",
        "z-index": "",
      });
    }
  });
}

declare module "kijs" {
  class Kijs {
    sticky(options?: Partial<Options>): this;
    unstick(): this;
  }
}

function installer(Ki: typeof Kijs) {
  $window.on("scroll", scroller).on("resize", resizer);

  Ki.prototype.sticky = function (options?) {
    init(this, options);

    return this;
  };

  Ki.prototype.unstick = function () {
    unstick(this);

    return this;
  };

  ready(() => setTimeout(scroller, 0));
}

export default installer;
export { sticky, unstick, sticked, scroller, resizer, defaults as OptionsDefault };
export type { Options };