import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "mass-anonymize-admin-plugin-configuration-nav",

  initialize(container) {
    const currentUser = container.lookup("service:current-user");
    if (!currentUser?.admin) {
      return;
    }

    withPluginApi((api) => {
      api.addAdminPluginConfigurationNav("mass-anonymizer", [
        {
          label: "mass_anonymize.title",
          route: "adminPlugins.show.mass-anonymize",
        },
      ]);
    });
  },
};
