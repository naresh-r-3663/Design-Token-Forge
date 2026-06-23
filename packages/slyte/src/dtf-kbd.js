import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-kbd — DTF Slyte wrapper
 * Keyboard key badge.
 *
 * Usage:
 *   <dtf-kbd lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-kbd>
 */
class DtfKbd extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
    };
  }

}

export { DtfKbd };
