const assert = require('assert')

const { buildProfileForSave } = require('../miniprogram/utils/profileForm')

const profile = buildProfileForSave({
  gender: 'male',
  age: '31',
  height: '175.5',
  weight: '88.2',
  targetWeight: '78',
  activityLevel: 'moderate',
  goal: 'fat_loss'
})

assert.strictEqual(profile.age, 31)
assert.strictEqual(profile.height, 175.5)
assert.strictEqual(profile.weight, 88.2)
assert.strictEqual(profile.targetWeight, 78)
assert.strictEqual(profile.gender, 'male')

console.log('profile form tests passed')
