import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-menu-button — DTF Slyte wrapper
 * Menu trigger button. showChevron adds caret via data-show-chevron.
 *
 * Usage:
 *   <dtf-menu-button lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-menu-button>
 */
class DtfMenuButton extends Component {
  data() {
    return {
      variant: prop("string", { default: "filled" }),
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      disabled: prop("boolean", { default: false }),
      loading: prop("boolean", { default: false }),
      rounded: prop("boolean", { default: false }),
      showChevron: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".menu-btn");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
    el.toggleAttribute("data-loading", this.getData("loading"));
    el.toggleAttribute("data-rounded", this.getData("rounded"));
    el.toggleAttribute("data-show-chevron", this.getData("showChevron"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".menu-btn");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      loadingChanged: function() {
        var el = this.$node.querySelector(".menu-btn");
        if (el) el.toggleAttribute("data-loading", this.getData("loading"));
      }.observes("loading"),
      roundedChanged: function() {
        var el = this.$node.querySelector(".menu-btn");
        if (el) el.toggleAttribute("data-rounded", this.getData("rounded"));
      }.observes("rounded"),
      showChevronChanged: function() {
        var el = this.$node.querySelector(".menu-btn");
        if (el) el.toggleAttribute("data-show-chevron", this.getData("showChevron"));
      }.observes("showChevron"),
    };
  }
}

export { DtfMenuButton };
