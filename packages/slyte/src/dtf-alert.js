import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-alert — DTF Slyte wrapper
 * Alert banner. on-dismiss fires when the dismiss button is clicked.
 *
 * Usage:
 *   <dtf-alert lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-alert>
 */
class DtfAlert extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      variant: prop("string", { default: "soft" }),
      accent: prop("string", { default: "" }),
      title: prop("string", { default: "" }),
      dismissible: prop("boolean", { default: false }),
    };
  }


  static actions() {
    return {
      onDismiss: function() {
        this.throwEvent('dismiss');
      }
    };
  }
}

export { DtfAlert };
