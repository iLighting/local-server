//noinspection JSUnresolvedVariable
const expect = require('chai').expect;
const Schema = require('mongoose').Schema;

const ObjectId = Schema.Types.ObjectId;

// device
// ---------------------------------------

const deviceSchema = new Schema({
  _id: {
    $type: Number,
    required: [true, 'device id (网络地址) 是必须的']
  },
  ieee: {
    $type: String,
    required: true
  },
  type: {
    $type: String,
    required: [true, '设备类型是必须的'],
    enum: ['router', 'endDevice', 'coordinator']
  }
}, {
  timestamps: true,
  toObject: true,
  toJSON: true,
  strict: true,
  typeKey: '$type',
  minimize: false
});
deviceSchema.name = 'Device';
deviceSchema.query.byId = function(id) {
  return this.findOne({_id: id});
}
deviceSchema.methods.findApps = function(cb) {
  const self = this;
  self.model(appSchema.name).find({device: self._id}, cb);
}

// app
// ---------------------------------------

const appSchema = new Schema({
  device: {$type: Number, ref: deviceSchema.name },
  endPoint: {
    $type: Number,
    min: 0,
    max: 255
  },
  type: {
    $type: String,
    required: true,
    enum: ['lamp', 'sensor-light']
  },
  payload: {
    $type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toObject: true,
  toJSON: true,
  strict: true,
  typeKey: '$type',
  minimize: false
});
appSchema.name = 'AppLamp';
// app's validator
appSchema.pre('validate', function(next) {
  const self = this;
  const {endPoint, type, payload} = self;
  if (type=='lamp') {
    try {
      expect(payload).to.have.property('level');
      expect(payload.level).to.be.a('number');
      expect(payload.level).to.be.within(0,255);
    } catch(e) {
      next(e);
    }
  }
  next();
});

// export
// -----------------

module.exports = {
  deviceSchema,
  appSchema
}
