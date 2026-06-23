import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-select — DTF Slyte wrapper
 * Native select with chevron. Pass <option> elements as yield.
 *
 * Usage:
 *   <dtf-select lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-select>
 */
class DtfSelect extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
      variant: prop("string", { default: "outlined" }),
      label: prop("string", { default: "" }),
      disabled: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".select");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".select");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
    };
  }
}

export { DtfSelect };
