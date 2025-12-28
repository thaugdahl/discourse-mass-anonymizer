import Controller from "@ember/controller";
import EmberObject, { action } from "@ember/object";
import { tracked, TrackedArray } from "@glimmer/tracking";

import { ajax } from "discourse/lib/ajax"


export default class AdminPluginsMassAnonymizeController extends Controller {
  @tracked eligibleUsers = [];

  @tracked isLoading = false;

  @tracked anonState = {};

  usersFetched = false;

  isHandled(user) {
    console.log(this?.anonState[user.id]);
    return this?.anonState[user.id];
  }



  setAnonymized(id) {

    const isEqual = (id, user) => {
      return id == user.id;
    };

    const result =  this.eligibleUsers.map((usr) => {

      const result = {...usr};

      if ( isEqual(id, usr) ) {
        result.anonymized = true;
      }

      return EmberObject.create({...result});
    });

    this.eligibleUsers = [...result];

    console.log(this.eligibleUsers);
  }

  @action getUsers() {
    if ( this.usersFetched ) {
      return;
    }

    this.isLoading = true;
    const res = ajax("/mass-anonymize/admin.json");

    res.then(
      (res) => {
        const users = res;

        this.eligibleUsers = users.map((user) => {
          const then = new Date(user.last_seen_at)
          const now = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;

          user.days_since = Math.floor((now - then) / msPerDay).toString() + " days";

          const result = EmberObject.create({...user, anonymized: false});

          return result;
        });
      }).catch((err) => console.error(err)).finally(() => {this.isLoading = false;});
  }

  @action anonymizeAll() {

    const SEGMENT_SIZE = 5;

    const self = this;

    // Segment the anonymization array
    const allToAnonymize = this.eligibleUsers.map((user) => {
          return user.id
        });

    const numToAnonymize = allToAnonymize.length;

    const shouldContinue = (segmentIdx) => {
      return segmentIdx * SEGMENT_SIZE < numToAnonymize;
    };

    const applySequence = (segmentIdx) => {
      const segmentStart = segmentIdx * SEGMENT_SIZE;
      const segmentEnd = segmentStart + SEGMENT_SIZE;
      const segment = allToAnonymize.slice(segmentStart, segmentEnd);

      const res = ajax("/mass-anonymize/anonymize.json", {
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          users: segment       })
      })

      res.then((data) => {
        const handledUsers = data;
        console.log(handledUsers);

        handledUsers?.anonymizedIds.forEach((id) => {
          this.setAnonymized(id);
        });

        if ( shouldContinue(segmentIdx+1) ) {
          applySequence(segmentIdx+1);
        }
      })
    };

    applySequence(0);
  }
}
