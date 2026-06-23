import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-slider — DTF Slyte wrapper
 * Range slider. Fires on-change with new numeric value.
 *
 * Usage:
 *   <dtf-slider lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-slider>
 */
class DtfSlider extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      label: prop("string", { default: "" }),
      disabled: prop("boolean", { default: false }),
      min: prop("number", { default: 0 }),
      max: prop("number", { default: 100 }),
      value: prop("number", { default: 0 }),
      step: prop("number", { default: 1 }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".slider");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static actions() {
    return {
      onInput: function(e) {
        var val = Number(e.target.value);
        this.setData('value', val);
        this.throwEvent('change', val);
      }
    };
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".slider");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
    };
  }
}

export { DtfSlider };
