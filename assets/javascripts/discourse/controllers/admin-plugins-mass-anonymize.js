import Controller from "@ember/controller";
import EmberObject, { action } from "@ember/object";
import { tracked, TrackedArray } from "@glimmer/tracking";

import { ajax } from "discourse/lib/ajax"

class MAStates {
  static IDLE = 0;
  static SELECTED = 1;
  static IN_PROGRESS = 2;
  static ANONYMIZED = 3;

  static toggle(state) {
    if ( state == MAStates.IDLE ) return MAStates.SELECTED;
    else if ( state == MAStates.SELECTED ) return MAStates.IDLE;
    else { return state; }
  }
};

export default class AdminPluginsMassAnonymizeController extends Controller {

  @tracked eligibleUsers = [];

  @tracked isLoading = false;

  @tracked anonState = {};

  usersFetched = false;

  setAnonymized(id) {

    const isEqual = (id, user) => {
      return id == user.id;
    };

    const result =  this.eligibleUsers.map((usr) => {

      const result = {...usr};

      if ( isEqual(id, usr) ) {
        result.maState = this.STATE_ANONYMIZED;
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

          const result = EmberObject.create({...user, maState: MAStates.IDLE});

          return result;
        });
      }).catch((err) => console.error(err)).finally(() => {this.isLoading = false;});
  }

  @action deselectAll() {
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if ( user.maState == MAStates.SELECTED ) user.maState = MAStates.IDLE;
      return EmberObject.create({...user});
    });
  }

  @action selectAll() {
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      user.maState = MAStates.SELECTED;
      return EmberObject.create({...user});
    });
  }

  isProcessing(user) {
    return user.maState >= MAStates.IN_PROGRESS;
  }

  isDone(user) {
    return user.maState == MAStates.ANONYMIZED;
  }

  isChecked(user) {
    const result = user.maState == MAStates.SELECTED;
    return result;
  }

  updateState(userId, state) {
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if ( user.id == userId ) user.maState = state;
      return EmberObject.create({...user});
    });
  }


  @action setSelected(user) {
    const id = user.id;
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if ( user.id == id ) {
        const state = user.maState;

        user.maState = MAStates.toggle(state);

        return EmberObject.create({...user});
      }
      return user;
    });
  }

  @action anonymizeAll() {

    const SEGMENT_SIZE = 5;

    const self = this;

    // Segment the anonymization array
    const allToAnonymize = this.eligibleUsers
      .filter((user) => {
        if ( user.maState == MAStates.SELECTED ) return true;
        return false;
      })
    .map((user) => {
          return user.id
        });

    console.log(allToAnonymize);

    const numToAnonymize = allToAnonymize.length;

    const shouldContinue = (segmentIdx) => {
      return segmentIdx * SEGMENT_SIZE < numToAnonymize;
    };

    const applySequence = (segmentIdx) => {
      const segmentStart = segmentIdx * SEGMENT_SIZE;
      const segmentEnd = segmentStart + SEGMENT_SIZE;
      const segment = allToAnonymize.slice(segmentStart, segmentEnd);

      segment.forEach((id) => {
        // TODO: Fix magic constants
        this.updateState(id, MAStates.IN_PROGRESS);
      });


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
          this.updateState(id, MAStates.ANONYMIZED);
        });

        if ( shouldContinue(segmentIdx+1) ) {
          applySequence(segmentIdx+1);
        }
      })
    };

    applySequence(0);
  }
}
