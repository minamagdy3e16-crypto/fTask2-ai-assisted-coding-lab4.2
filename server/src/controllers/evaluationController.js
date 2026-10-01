import { Evaluation } from '../models/Evaluation.js';

function validEvaluationInput(body) {
  return body
    && typeof body.seminarCode === 'string'
    && body.seminarCode.length > 0
    && (typeof body.score === 'number' || typeof body.score === 'string')
    && body.score !== undefined
    && body.score !== null
    && Number.isFinite(Number(body.score))
    && Number(body.score) >= 1
    && Number(body.score) <= 5
    && (body.comment === undefined || typeof body.comment === 'string')
    && (body.evaluatedBy === undefined || (typeof body.evaluatedBy === 'string' && /^[0-9a-fA-F]{24}$/.test(body.evaluatedBy)));
}

// GET /api/evaluations
export async function getAllEvaluations(req, res, next) {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 });
    res.json({ evaluations });
  } catch (err) { next(err); }
}

// GET /api/evaluations/:id
export async function getEvaluation(req, res, next) {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
    res.json({ evaluation });
  } catch (err) { next(err); }
}

// POST /api/evaluations
export async function createEvaluation(req, res, next) {
  try {
    if (!validEvaluationInput(req.body)) {
      return res.status(400).json({ message: 'Invalid evaluation data' });
    }

    const { seminarCode, score, comment, evaluatedBy } = req.body;
    const evaluation = await Evaluation.create({ seminarCode, score, comment, evaluatedBy });
    res.status(201).json({ evaluation });
  } catch (err) { next(err); }
}

// GET /api/evaluations/summary?seminarCode=SM101
export async function getEvaluationSummary(req, res, next) {
  try {
    const { seminarCode } = req.query;
    if (!seminarCode) return res.status(400).json({ message: 'seminarCode is required' });

    const [summary] = await Evaluation.aggregate([
      { $match: { seminarCode } },
      {
        $group: {
          _id: '$seminarCode',
          averageScore: { $avg: '$score' },
          evaluationCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      seminarCode,
      averageScore: summary?.averageScore ?? 0,
      evaluationCount: summary?.evaluationCount ?? 0
    });
  } catch (err) { next(err); }
}
