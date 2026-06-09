<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Activity;
use App\Models\Baby;

class ActivityController extends Controller
{
    public function getBabies(Request $request)
    {
        return response()->json($request->user()->babies);
    }

    public function addBaby(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
        ]);

        $baby = $request->user()->babies()->create([
            'name' => $request->name,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
        ]);

        return response()->json($baby, 201);
    }

    public function index(Request $request)
    {
        $babyId = $request->query('baby_id');
        if (!$babyId) {
            return response()->json(['message' => 'baby_id is required'], 400);
        }

        // Make sure the baby belongs to the user
        $baby = $request->user()->babies()->find($babyId);
        if (!$baby) {
            return response()->json(['message' => 'Baby not found'], 404);
        }

        $activities = Activity::where('baby_id', $babyId)
            ->orderBy('activity_time', 'desc')
            ->get();
            
        return response()->json($activities);
    }

    public function store(Request $request)
    {
        $request->validate([
            'baby_id' => 'required|integer',
            'type' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $baby = $request->user()->babies()->find($request->baby_id);
        if (!$baby) {
            return response()->json(['message' => 'Baby not found'], 404);
        }

        $activity = Activity::create([
            'baby_id' => $baby->id,
            'type' => $request->type,
            'notes' => $request->notes,
            'activity_time' => now(),
        ]);

        return response()->json($activity, 201);
    }
}
