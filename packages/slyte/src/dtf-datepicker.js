import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-datepicker — DTF Slyte wrapper
 * Date picker wrapper. Full calendar JS requires DTF vanilla JS layer.
 *
 * Usage:
 *   <dtf-datepicker lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-datepicker>
 */
class DtfDatepicker extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
      mode: prop("string", { default: "popup" }),
      label: prop("string", { default: "" }),
      placeholder: prop("string", { default: "Pick a date" }),
      value: prop("string", { default: "" }),
      range: prop("boolean", { default: false }),
      disabled: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".datepicker");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static actions() {
    return {
      onChange: function(e) {
        this.setData('value', e.target.value);
        this.throwEvent('change', e.target.value);
      }
    };
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".datepicker");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
    };
  }
}

export { DtfDatepicker };
