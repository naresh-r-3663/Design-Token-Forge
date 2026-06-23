import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-input — DTF Slyte wrapper
 * Text input. Label is optional.
 *
 * Usage:
 *   <dtf-input lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-input>
 */
class DtfInput extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
      variant: prop("string", { default: "outlined" }),
      label: prop("string", { default: "" }),
      placeholder: prop("string", { default: "" }),
      value: prop("string", { default: "" }),
      type: prop("string", { default: "text" }),
      disabled: prop("boolean", { default: false }),
      error: prop("boolean", { default: false }),
      loading: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".input");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
    el.toggleAttribute("data-error", this.getData("error"));
    el.toggleAttribute("data-loading", this.getData("loading"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".input");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      errorChanged: function() {
        var el = this.$node.querySelector(".input");
        if (el) el.toggleAttribute("data-error", this.getData("error"));
      }.observes("error"),
      loadingChanged: function() {
        var el = this.$node.querySelector(".input");
        if (el) el.toggleAttribute("data-loading", this.getData("loading"));
      }.observes("loading"),
    };
  }
}

export { DtfInput };
