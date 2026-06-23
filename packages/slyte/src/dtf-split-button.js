import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-split-button — DTF Slyte wrapper
 * Two-zone split button. on-action-click and on-menu-click fire separately.
 *
 * Usage:
 *   <dtf-split-button lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-split-button>
 */
class DtfSplitButton extends Component {
  data() {
    return {
      variant: prop("string", { default: "filled" }),
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      menuLabel: prop("string", { default: "More options" }),
      disabled: prop("boolean", { default: false }),
      loading: prop("boolean", { default: false }),
      rounded: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".split-btn");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
    el.toggleAttribute("data-loading", this.getData("loading"));
    el.toggleAttribute("data-rounded", this.getData("rounded"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static actions() {
    return {
    onAction: function() { this.throwEvent('action-click'); },
    onMenu:   function() { this.throwEvent('menu-click'); }
    };
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".split-btn");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      loadingChanged: function() {
        var el = this.$node.querySelector(".split-btn");
        if (el) el.toggleAttribute("data-loading", this.getData("loading"));
      }.observes("loading"),
      roundedChanged: function() {
        var el = this.$node.querySelector(".split-btn");
        if (el) el.toggleAttribute("data-rounded", this.getData("rounded"));
      }.observes("rounded"),
    };
  }
}

export { DtfSplitButton };
