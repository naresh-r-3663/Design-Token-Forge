import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-spinner — DTF Slyte wrapper
 * Indeterminate loading spinner.
 *
 * Usage:
 *   <dtf-spinner lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-spinner>
 */
class DtfSpinner extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      label: prop("string", { default: "Loading" }),
    };
  }

}

export { DtfSpinner };
