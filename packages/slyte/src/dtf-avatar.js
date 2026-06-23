import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-avatar — DTF Slyte wrapper
 * Avatar with image, initials fallback, status ring, badge count.
 *
 * Usage:
 *   <dtf-avatar lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-avatar>
 */
class DtfAvatar extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
      status: prop("string", { default: "" }),
      src: prop("string", { default: "" }),
      alt: prop("string", { default: "Avatar" }),
      initials: prop("string", { default: "" }),
      badgeCount: prop("number", { default: 0 }),
    };
  }

}

export { DtfAvatar };
