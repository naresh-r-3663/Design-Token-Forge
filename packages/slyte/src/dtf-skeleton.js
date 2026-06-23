import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-skeleton — DTF Slyte wrapper
 * Skeleton loader. width/height applied via didConnect style.
 *
 * Usage:
 *   <dtf-skeleton lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-skeleton>
 */
class DtfSkeleton extends Component {
  data() {
    return {
      variant: prop("string", { default: "rect" }),
      width: prop("string", { default: "" }),
      height: prop("string", { default: "" }),
    };
  }

  _syncSize() {
    var el = this.$node.querySelector(".skeleton");
    if (!el) return;
    var w = this.getData("width");
    var h = this.getData("height");
    if (w) el.style.width = w;
    if (h) el.style.height = h;
  }

  didConnect() {
    this._syncSize();
  }
}

export { DtfSkeleton };
