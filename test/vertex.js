const gremlinOrm = require('./../dist/gremlin-orm');
const g = new gremlinOrm('neo4j');

const { assert, expect } = require('chai');

const Person = g.define('person', {
  'name': {
    type: g.STRING,
    required: true
  },
  'age' : {
    type: g.NUMBER
  },
  'dob' : {
    type: g.DATE
  },
  'developer' : {
    type: g.BOOLEAN
  }
});

const Knows = g.defineEdge('knows', {
  'duration': {
    type: g.NUMBER,
    required: true
  }
});

describe('Vertex Model', () => {
  beforeEach(done => {
    g.queryRaw('g.V().drop()', () => {done()});
  });
  describe('Define', () => {
    it('Should define a new vertex model called Person', () => {
      expect(Person.createEdge).to.be.a('function');
    });
  });

  describe('Create', () => {
    it('Should create a new vertex with valid parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        expect(result).to.have.property('name');
        expect(result).to.have.property('age');
        expect(result.name).to.equal('John');
        done();
      });
    });
    it('Should not create new vertex if required parameter missing', (done) => {
      Person.create({'age': 20}, (err, result) => {
        expect(result).to.equal(undefined);
        // expect(result).to.have.property('age');
        // expect(result.name).to.equal('John');
        done();
      });
    });
    it('Should not create new vertex if number type prop is wrong', (done) => {
      Person.create({'name': 'John', 'age': '20'}, (err, result) => {
        expect(result).to.equal(undefined);
        // expect(result).to.have.property('age');
        // expect(result.name).to.equal('John');
        done();
      });
    });
    it('Should not create new vertex if date type prop is wrong', (done) => {
      Person.create({'name': 'John', 'dob': 'abc'}, (err, result) => {
        expect(result).to.equal(undefined);
        // expect(result).to.have.property('age');
        // expect(result.name).to.equal('John');
        done();
      });
    });
    it('Should not create new vertex if boolean type prop is wrong', (done) => {
      Person.create({'name': 'John', 'developer': 'abc'}, (err, result) => {
        expect(result).to.equal(undefined);
        // expect(result).to.have.property('age');
        // expect(result.name).to.equal('John');
        done();
      });
    });
  });

  describe('CreateEdge', () => {
    it('Should create an edge between two vertices', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
          john.createEdge(Knows, {'duration': 1}, result, (err, results) => {
            expect(results).to.have.lengthOf(1);
            expect(results[0].duration).to.equal(1);
            done();
          });
        });
      });
    });
    it('Should not create an edge with invalid properties', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
          john.createEdge(Knows, {'duration': 'abc'}, result, (err, results) => {
            expect(results).to.equal(undefined);
            done();
          });
        });
      });
    });
  });

  describe('Find', () => {
    it('Should find a vertex with matching parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        Person.find({'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': true}, (err, result) => {
          expect(result).to.have.property('name');
          expect(result).to.have.property('age');
          expect(result.name).to.equal('John');
          done();
        });
      });
    });
  });

  describe('FindAll', () => {
    it('Should find multiple vertices with matching parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          Person.findAll({'age': 20, 'developer': true}, (err, results) => {
            expect(results).to.have.lengthOf(2);
            expect(results[1].name).to.equal('Jane');
            done();
          });
        });
      });
    });
  });

  describe('FindRelated', () => {
    it('Should find related vertices', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            john.findRelated(Knows, {}, 1, (err, results) => {
              expect(results[0].name).to.equal('Jane');
              done();
            });
          });
        });
      });
    });
    it('Should find only related vertices with matching parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              john.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                john.findRelated(Knows, {'duration': 1}, 1, (err, results) => {
                  expect(results[0].name).to.equal('Jane');
                  expect(results).to.have.lengthOf(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find related vertices at specified depth', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              jane.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                john.findRelated(Knows, {}, 2, (err, results) => {
                  expect(results[0].name).to.equal('Jack');
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('FindEdge', () => {
    it('Should find attached edges in both directions', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              jane.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                jane.findEdge(Knows, {}, (err, results) => {
                  expect(results).to.have.lengthOf(2);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find only attached edges with matching properties', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              john.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                john.findEdge(Knows, {'duration': 2}, (err, results) => {
                  expect(results).to.have.lengthOf(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('FindImplicit', () => {
    it('Should find one implicitly related vertex', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge(Knows, {'duration': 3}, jane, (err, results) => {
                john.findImplicit(Knows, {}, (err, results) => {
                  expect(results[0].name).to.equal('Joe');
                  done();
                });
              });
            });
          });
        });
      });
    });

    it('Should find only implicit vertices with matching properties', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            Person.create({'name': 'James', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
                Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
                  result.createEdge(Knows, {'duration': 3}, jane, (err, results) => {
                    john.findImplicit(Knows, {'duration': 1}, (err, results) => {
                      expect(results[0].name).to.equal('James');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    it('Should find multiple implicitly related vertices', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'James', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
                Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
                  result.createEdge(Knows, {'duration': 3}, jane, (err, results) => {
                    john.findImplicit(Knows, {}, (err, results) => {
                      expect(results).to.have.lengthOf(2);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
