module.exports = {
  localize: function(text) {
    var en_hu =
      { 'can\'t be blank': 'kötelező kitölteni'
      , 'is blank': 'üres'
      , 'is not unique': 'nem egyedi'
      , 'is invalid': 'nem megfelelő'
      , 'too short': 'túl rövid'
      }
    return en_hu[text] || text
  }
  , capitaliseFirstLetter: function(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
      // ruby

      //pluralize(1, 'asd') // 1 asd
      //pluralize(2, 'asd') // 2 asds
      //pluralize(0, 'asd') // 0 asds
      //pluralize(3, 'person') // 3 people
    }

}
