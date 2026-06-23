import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-toast — DTF Slyte wrapper
 * Toast notification. on-dismiss and on-action fire on button clicks.
 *
 * Usage:
 *   <dtf-toast lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-toast>
 */
class DtfToast extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      actionLabel: prop("string", { default: "" }),
      title: prop("string", { default: "" }),
      persistent: prop("boolean", { default: false }),
    };
  }


  static actions() {
    return {
      onDismiss: function() { this.throwEvent('dismiss'); },
      onAction:  function() { this.throwEvent('action'); }
    };
  }
}

export { DtfToast };
