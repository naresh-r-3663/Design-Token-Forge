import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-icon-button — DTF Slyte wrapper
 * Square icon-only button. Pass aria-label for accessibility.
 *
 * Usage:
 *   <dtf-icon-button lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-icon-button>
 */
class DtfIconButton extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      ariaLabel: prop("string", { default: "" }),
      disabled: prop("boolean", { default: false }),
      loading: prop("boolean", { default: false }),
      rounded: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".icon-btn");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
    el.toggleAttribute("data-loading", this.getData("loading"));
    el.toggleAttribute("data-rounded", this.getData("rounded"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".icon-btn");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      loadingChanged: function() {
        var el = this.$node.querySelector(".icon-btn");
        if (el) el.toggleAttribute("data-loading", this.getData("loading"));
      }.observes("loading"),
      roundedChanged: function() {
        var el = this.$node.querySelector(".icon-btn");
        if (el) el.toggleAttribute("data-rounded", this.getData("rounded"));
      }.observes("rounded"),
    };
  }
}

export { DtfIconButton };
